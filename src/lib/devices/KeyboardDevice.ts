import { KeyCode } from "./keyboard/keys";
import { requestKeyboardLayout, getLayoutKeyLabel, inferKeyboardLayoutFromLang, KeyboardLayout, KeyboardLayoutSource, detectKeyboardLayoutFromKeydown, getNavigatorKeyLabel } from "./keyboard/layouts";
import { NavigationIntent, REPEATABLE_NAV_INTENTS } from "../navigation/NavigationIntent";
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

export interface KeyboardDeviceNamedGroupKeydownEvent extends KeyboardDeviceKeydownEvent {
  groupName: string;
}

export type KeyboardDeviceEvent = {
  layoutdetected: KeyboardDeviceLayoutUpdatedEvent;
  group: KeyboardDeviceNamedGroupKeydownEvent;
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

  /** Timestamp of when the keyboard was last interacted with. */
  public lastInteraction = performance.now();

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

  public options = {
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

  private readonly _emitter = new EventEmitter<KeyboardDeviceEvent>();
  private readonly _groupEmitter = new EventEmitter<Record<string, KeyboardDeviceNamedGroupKeydownEvent>>();

  private _layout: KeyboardLayout;
  private _layoutSource: KeyboardLayoutSource;
  private _deferredKeydown: KeyboardEvent[] = [];

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
      this.detectLayoutOnKeypress = false;

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
    this.detectLayoutOnKeypress = false;
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

  // ----- Events: -----

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

  /** Add a named group event listener (or all if none provided). */
  public onGroup(
    name: string,
    listener: ( event: KeyboardDeviceNamedGroupKeydownEvent ) => void
  ): this
  {
    this._groupEmitter.on( name, listener );
    return this;
  }

  /** Remove a named group event listener (or all if none provided). */
  public offGroup(
    name: string,
    listener?: ( event: KeyboardDeviceNamedGroupKeydownEvent ) => void
  ): this
  {
    this._groupEmitter.off( name, listener );
    return this;
  }

  // ----- Helpers: -----

  /**
   * Get the label for the given key code in the current keyboard
   * layout. Attempts to use the Navigator KeyboardLayoutMap API
   * before falling back to defaults.
   *
   * @see https://caniuse.com/mdn-api_keyboardlayoutmap
   *
   * @example
   * keyboard.getKeyLabel( "KeyZ" ) === "W" // AZERTY
   * keyboard.getKeyLabel( "KeyZ" ) === "Я" // JCUKEN
   * keyboard.getKeyLabel( "KeyZ" ) === "Z" // QWERTY
   * keyboard.getKeyLabel( "KeyZ" ) === "Y" // QWERTZ
   */
  public getKeyLabel( key: KeyCode, layout?: KeyboardLayout ): string
  {
    if ( layout ) return getLayoutKeyLabel( key, layout );

    return getNavigatorKeyLabel( key )
      ?? getLayoutKeyLabel( key, layout ?? this._layout );
  }

  /**
   * Process pending keyboard events.
   *
   * @returns any group events to trigger
   */
  public update( now: number ): void
  {
    if( this._deferredKeydown.length > 0 )
    {
      this._deferredKeydown.forEach( (event) => this._processDeferredKeydownEvent(event) );
      this._deferredKeydown.length = 0;
    }
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
    const k = this.key as Record<string, boolean>;
    const d = this._deferredKeydown;

    window.addEventListener(
      "keydown",
      e =>
      {
        k[e.code] = true;
        d.push( e );
        this.lastInteraction = performance.now();
      },
      { passive: true, capture: true }
    );

    window.addEventListener(
      "keyup",
      e =>
      {
        k[e.code] = false;
        this.lastInteraction = performance.now();
      },
      { passive: true, capture: true }
    );
  }

  private _processDeferredKeydownEvent( e: KeyboardEvent ): void
  {
    const keyCode = e.code as KeyCode;

    if ( !e.repeat )
    {
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
          keyLabel: this.getKeyLabel( keyCode ),
          event: e,
        }));
      }

      // check named groups
      Object.entries( this.options.namedGroups ).forEach(([ name, keys ]) =>
      {
        if ( !keys.includes( keyCode ) ) return;

        setTimeout( () =>
        {
          const event = {
            device: this,
            keyCode,
            keyLabel: this.getKeyLabel( keyCode ),
            event: e,
            groupName: name,
          };

          this._groupEmitter.emit( name, event );
          this._emitter.emit( "group", event );
        });
      });
    }

    // navigation
    if (
      Navigation.options.enabled &&
      this.options.navigation.enabled &&
      this.options.navigation.binds[keyCode] !== undefined
    )
    {
      const intent = this.options.navigation.binds[keyCode]!;

      if ( !e.repeat || REPEATABLE_NAV_INTENTS.includes(intent) )
      {
        setTimeout( () =>
          Navigation.commit( this.options.navigation.binds[keyCode]!, this )
        );
      }
    }
  }
}
