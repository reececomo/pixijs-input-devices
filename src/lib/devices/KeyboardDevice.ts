import { KeyCode } from "./keyboard/keys";
import { requestKeyboardLayout, getLayoutLabel, inferKeyboardLayoutFromLang, KeyboardLayout, KeyboardLayoutSource, detectKeyboardLayoutFromKeydown } from "./keyboard/layouts";
import { NavigationIntent } from "../navigation/NavigationIntent";
import { Navigation } from "../navigation/Navigation";
import { EventEmitter } from "../utils/events";


export { KeyCode, KeyboardLayout };

export interface KeyboardDeviceKeydownEvent {
  event: KeyboardEvent,
  device: KeyboardDevice,
  keyCode: KeyCode,
  /** Layout-specific label for key. @example "Ц" // JCUKEN for "KeyW" */
  keyLabel: string,
}

export interface KeyboardDeviceLayoutUpdatedEvent {
  device: KeyboardDevice;
  layout: KeyboardLayout;
  layoutSource: KeyboardLayoutSource;
}

export type KeyboardDeviceEvent = {
  layoutdetected: KeyboardDeviceLayoutUpdatedEvent;
} & {
  [key in KeyCode]: KeyboardDeviceKeydownEvent;
};

type NavigationBinds = Partial<Record<KeyCode, NavigationIntent>>;

export class KeyboardDevice
{
  public static global = new KeyboardDevice();

  public readonly type = "keyboard";
  public readonly id = "keyboard";

  /**
   * Associate custom meta data with a device.
   */
  public readonly meta: Record<string, any> = {};

  public lastUpdated = performance.now();

  /**
   * Detect layout from keypresses.
   *
   * This will continuously check "keydown" events until the
   * layout can be determined.
   */
  public detectLayoutOnKeypress = true;

  /**
   * Keyboard has been detected.
   */
  public detected = false;

  private _layout: KeyboardLayout;
  private _layoutSource: KeyboardLayoutSource;
  private _emitter = new EventEmitter<KeyboardDeviceEvent>();

  public options = {
    /**
     * Keys to prevent default event propagation for.
     */
    preventDefaultKeys: new Set<KeyCode>([]),

    /**
     * Create named groups of buttons.
     *
     * This can be used with `groupPressed( name )`.
     *
     * @example
     * // set by names
     * Keyboard.options.namedGroups = {
     *   jump: [ "ArrowUp", "KeyW" ],
     *   left: [ "ArrowLeft", "KeyA" ],
     *   crouch: [ "ArrowDown", "KeyS" ],
     *   right: [ "ArrowRight", "KeyD" ],
     * }
     *
     * // check by named presses
     * if ( keyboard.groupPressed( "jump" ) )
     * {
     *   // ...
     * }
     */
    namedGroups: {} as Partial<Record<string, KeyCode[]>>,

    navigation: {
      enabled: true,
      binds: {
        "Space": "trigger",
        "Enter": "trigger",
        "Escape": "navigateBack",
        "Backspace": "navigateBack",
        "ArrowDown": "navigateDown",
        "ArrowLeft": "navigateLeft",
        "ArrowRight": "navigateRight",
        "ArrowUp": "navigateUp",
        "KeyA": "navigateLeft",
        "KeyD": "navigateRight",
        "KeyS": "navigateDown",
        "KeyW": "navigateUp",
      } as NavigationBinds,
    },
  };

  /** Accessors for keys */
  public key: Record<KeyCode, boolean> =
    Object.keys(KeyCode).reduce( (obj, key) =>
    {
      obj[key] = false;
      return obj;
    }, {} as any );

  private constructor()
  {
    this._layout = inferKeyboardLayoutFromLang();
    this._layoutSource = "lang";

    // auto-detect layout
    requestKeyboardLayout().then( layout =>
    {
      if ( layout === undefined ) return; // not detected

      this._layoutSource = "browser";
      this._layout = layout;

      this._emitter.emit( "layoutdetected", {
        layoutSource: "browser",
        layout: layout,
        device: this,
      });
    });

    this._configureEventListeners();
  }

  /**
   * Keyboard Layout
   *
   * If not set manually, this is determined by the browser (in
   * browsers that support detection), otherwise layout is inferred
   * on keypress, or from device language.
   *
   * Supports the "big four": `"QWERTY"`, `"AZERTY"`, `"QWERTZ"`,
   * and `"JCUKEN"` - i.e. it does not include specialized layouts
   * (e.g. Dvorak, Colemak, BÉPO), or regional layouts (e.g. Hangeul,
   * Kana) etc.
   *
   * When not set explicitly, this is provided by the browser,
   * or detected by keystrokes, or finally inferred from the
   * browser's language.
   *
   * @example "JCUKEN"
   */
  public get layout(): KeyboardLayout
  {
    return this._layout;
  }
  public set layout( value: KeyboardLayout )
  {
    this._layoutSource = "manual";
    this._layout = value;
  }

  /** How the keyboard layout was determined. */
  public get layoutSource(): KeyboardLayoutSource
  {
    return this._layoutSource;
  }

  // ----- Methods: -----

  /** @returns true if any key from the named group is pressed. */
  public groupPressed( name: string ): boolean
  {
    if ( this.options.namedGroups[name] === undefined ) return false;
    return this.anyPressed( this.options.namedGroups[name] );
  }

  /** @returns true if any of the given keys are pressed. */
  public anyPressed( keys: KeyCode[] ): boolean
  {
    for ( let i = 0; i < keys.length; i++ )
    {
      if ( this.key[keys[i]!] ) return true;
    }

    return false;
  }

  /** @returns true if all of the given keys are pressed. */
  public allPressed( keys: KeyCode[] ): boolean
  {
    for ( let i = 0; i < keys.length; i++ )
    {
      if ( !this.key[keys[i]!] ) return false;
    }

    return true;
  }

  /** Add an event listener. */
  public on<K extends keyof KeyboardDeviceEvent>(
    event: K,
    listener: (event: KeyboardDeviceEvent[K]) => void
  ): this
  {
    this._emitter.on(event, listener);
    return this;
  }

  /** Remove an event listener (or all if none provided). */
  public off<K extends keyof KeyboardDeviceEvent>(
    event: K,
    listener: (event: KeyboardDeviceEvent[K]) => void
  ): this
  {
    this._emitter.off(event, listener);
    return this;
  }

  /**
   * Get the label for the given key code in the current keyboard layout.
   *
   * @example
   * // when AZERTY
   * keyboard.localeLabel( "KeyQ" ) // "A"
   *
   * // when JCUKEN
   * keyboard.localeLabel( "KeyQ" ) // "Й"
   */
  public keyLabel( key: KeyCode, layout = this._layout ): string
  {
    return getLayoutLabel( key, layout );
  }

  /**
   * Clear all keyboard keys.
   */
  public clear(): void
  {
    for (const key of Object.keys(KeyCode))
    {
      this.key[key as KeyCode] = false;
    }
  }

  // ----- Implementation: -----

  private _configureEventListeners(): void
  {
    document.addEventListener( "keydown", e =>
    {
      const keyCode = e.code as KeyCode;

      this.key[keyCode] = true;

      if ( this.options.preventDefaultKeys.has( keyCode ) )e.preventDefault();

      // detect keyboard layout
      if ( this.detectLayoutOnKeypress && this._layoutSource === "lang" )
      {
        const layout = detectKeyboardLayoutFromKeydown( e );
        if ( layout !== undefined )
        {
          this._layout = layout;
          this._layoutSource = "keypress";
          this.detectLayoutOnKeypress = false;

          this._emitter.emit( "layoutdetected", {
            layout: layout,
            layoutSource: "keypress",
            device: this,
          });
        }
      }

      // dispatch events
      if ( this._emitter.hasListener( keyCode ) )
      {
        setTimeout( () => this._emitter.emit( keyCode, {
          device: this,
          keyCode,
          keyLabel: this.keyLabel( keyCode ),
          event: e,
        }));
      }
      else if (
        this.options.navigation.enabled &&
        this.options.navigation.binds[keyCode] !== undefined
      )
      {
        e.preventDefault();

        setTimeout( () =>
          Navigation.commit( this.options.navigation.binds[keyCode]!, this )
        );
      }
    });

    document.addEventListener( "keyup", e =>
    {
      this.key[e.code as KeyCode] = false;

      if ( this.options.preventDefaultKeys.has( e.code as KeyCode ) ) e.preventDefault();
    });
  }
}
