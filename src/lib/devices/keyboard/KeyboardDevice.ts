import { KeyCode } from "./keys";
import { EventEmitter, EventOptions } from "../../utils/events";
import {
  requestKeyboardLayout,
  getLayoutKeyLabel,
  inferKeyboardLayoutFromLang,
  KeyboardLayout,
  KeyboardLayoutSource,
  detectKeyboardLayoutFromKeydown,
  getNavigatorKeyLabel
} from "./layouts";


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

export interface KeyboardDeviceNamedBindKeydownEvent extends KeyboardDeviceKeydownEvent {
  name: string;
  repeat: boolean;
}

export type KeyboardDeviceEvent = {
  layoutdetected: KeyboardDeviceLayoutUpdatedEvent;
  binddown: KeyboardDeviceNamedBindKeydownEvent;
  bindup: KeyboardDeviceNamedBindKeydownEvent;
} & {
  [key in KeyCode]: KeyboardDeviceKeydownEvent;
};

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
         * Set named binds of keys.
         *
         * This can be used with `bindDown(name)`.
         *
         * @example
         * // set by names
         * Keyboard.options.binds = {
         *   jump: [ "ArrowUp", "KeyW" ],
         *   left: [ "ArrowLeft", "KeyA" ],
         *   crouch: [ "ArrowDown", "KeyS" ],
         *   right: [ "ArrowRight", "KeyD" ],
         * }
         *
         * // check by named presses
         * if (keyboard.bindDown("jump"))
         * {
         *   // ...
         * }
         */
    binds: {
      "navigate.back":  [ "Escape", "Backspace" ],
      "navigate.down":  [ "ArrowDown", "KeyS" ],
      "navigate.left":  [ "ArrowLeft", "KeyA" ],
      "navigate.right":  [ "ArrowRight", "KeyD" ],
      "navigate.trigger":  [ "Enter", "Space" ],
      "navigate.up":  [ "ArrowUp", "KeyW" ],
    } as Partial<Record<string, KeyCode[]>>,

    /**
         * These are the binds that are allowed to repeat when a key
         * is held down.
         *
         * @default ["navigate.down", "navigate.left", "navigate.right", "navigate.up"]
         */
    repeatableBinds: [
      "navigate.down",
      "navigate.left",
      "navigate.right",
      "navigate.up",
    ]
  };

  /** Accessors for keys */
  public key: Record<KeyCode, boolean> =
    Object.keys(KeyCode).reduce((obj, key) =>
    {
      obj[key] = false;

      return obj;
    }, {} as any);

  private readonly _emitter = new EventEmitter<KeyboardDeviceEvent>();
  private readonly _bindEmitter = new EventEmitter<Record<string, KeyboardDeviceNamedBindKeydownEvent>>();

  private _layout: KeyboardLayout;
  private _layoutSource: KeyboardLayoutSource;
  private _deferredKeydown: KeyboardEvent[] = [];
  private _deferredKeyup: KeyboardEvent[] = [];

  private constructor()
  {
    this._layout = inferKeyboardLayoutFromLang();
    this._layoutSource = "lang";

    // auto-detect layout
    requestKeyboardLayout().then(layout =>
    {
      if (layout === undefined)
      {
        // not detected
        return;
      }

      this._layoutSource = "browser";
      this._layout = layout;
      this.detectLayoutOnKeypress = false;

      this._emitter.emit("layoutdetected", {
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
  public set layout(value: KeyboardLayout)
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

  /** @returns true if any key from the named bind is pressed. */
  public bindDown(name: string): boolean
  {
    if (this.options.binds[name] === undefined) return false;

    return this.pressedAny(this.options.binds[name]);
  }

  /** @returns true if any of the given keys are pressed. */
  public pressedAny(keys: KeyCode[]): boolean
  {
    for (let i = 0; i < keys.length; i++)
    {
      if (this.key[keys[i]!]) return true;
    }

    return false;
  }

  /** @returns true if all of the given keys are pressed. */
  public pressedAll(keys: KeyCode[]): boolean
  {
    for (let i = 0; i < keys.length; i++)
    {
      if (!this.key[keys[i]!]) return false;
    }

    return true;
  }

  /** Set custom binds */
  public configureBinds<BindName extends string = string>(
    binds: Partial<Record<BindName, KeyCode[]>>
  ): void
  {
    this.options.binds = {
      ...this.options.binds,
      ...binds,
    };
  }

  // ----- Events: -----

  /** Add an event listener. */
  public on<K extends keyof KeyboardDeviceEvent>(
    event: K,
    listener: (event: KeyboardDeviceEvent[K]) => void,
    options?: EventOptions,
  ): this
  {
    this._emitter.on(event, listener, options);

    return this;
  }

  /** Remove an event listener (or all if none provided). */
  public off<K extends keyof KeyboardDeviceEvent>(
    event: K,
    listener?: (event: KeyboardDeviceEvent[K]) => void
  ): this
  {
    this._emitter.off(event, listener);

    return this;
  }

  /** Add a named bind event listener (or all if none provided). */
  public onBindDown(
    name: string,
    listener: (event: KeyboardDeviceNamedBindKeydownEvent) => void,
    options?: EventOptions,
  ): this
  {
    this._bindEmitter.on(name, listener, options);

    return this;
  }

  /** Remove a named bind event listener (or all if none provided). */
  public offBindDown(
    name: string,
    listener?: (event: KeyboardDeviceNamedBindKeydownEvent) => void
  ): this
  {
    this._bindEmitter.off(name, listener);

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
     * keyboard.getLabel("KeyZ") === "W" // AZERTY
     * keyboard.getLabel("KeyZ") === "Я" // JCUKEN
     * keyboard.getLabel("KeyZ") === "Z" // QWERTY
     * keyboard.getLabel("KeyZ") === "Face4" // QWERTZ
     */
  public getLabel(key: KeyCode, layout?: KeyboardLayout): string
  {
    if (layout) return getLayoutKeyLabel(key, layout);

    return getNavigatorKeyLabel(key)
      ?? getLayoutKeyLabel(key, layout ?? this._layout);
  }

  /**
     * Process deferred keyboard events.
     */
  public update(now: number): void
  {
    if(this._deferredKeydown.length > 0)
    {
      this._deferredKeydown.forEach((event) => this._processDeferredKeydownEvent(event));
      this._deferredKeydown.length = 0;
    }
    if(this._deferredKeyup.length > 0)
    {
      this._deferredKeyup.forEach((event) => this._processDeferredKeyupEvent(event));
      this._deferredKeyup.length = 0;
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
    window.addEventListener(
      "keydown",
      event =>
      {
        this.key[event.code as KeyCode] = true;
        this._deferredKeydown.push(event);
        this.lastInteraction = performance.now();
      },
      {
        passive: true,
        capture: true,
      },
    );

    window.addEventListener(
      "keyup",
      event =>
      {
        this.key[event.code as KeyCode] = false;
        this._deferredKeyup.push(event);
        this.lastInteraction = performance.now();
      },
      {
        passive: true,
        capture: true,
      },
    );
  }

  private _processDeferredKeydownEvent(e: KeyboardEvent): void
  {
    const keyCode = e.code as KeyCode;

    if (!e.repeat)
    {
      // detect keyboard layout
      if (this.detectLayoutOnKeypress && this._layoutSource === "lang")
      {
        const layout = detectKeyboardLayoutFromKeydown(e);
        if (layout !== undefined)
        {
          this._layout = layout;
          this._layoutSource = "keypress";
          this.detectLayoutOnKeypress = false;

          this._emitter.emit("layoutdetected", {
            layout: layout,
            layoutSource: "keypress",
            device: this,
          });
        }
      }

      // dispatch events
      if (this._emitter.hasListener(keyCode))
      {
        this._emitter.emit(keyCode, {
          device: this,
          keyCode,
          keyLabel: this.getLabel(keyCode),
          event: e,
        });
      }
    }

    // check named binds
    Object.entries(this.options.binds).forEach(([ name, keys ]) =>
    {
      if (!keys.includes(keyCode)) return;
      if (e.repeat && !this.options.repeatableBinds.includes(name))
      {
        return;
      }

      const event = {
        device: this,
        keyCode,
        keyLabel: this.getLabel(keyCode),
        event: e,
        name: name,
        repeat: e.repeat,
      };

      this._bindEmitter.emit(name, event);
      this._emitter.emit("binddown", event);
    });
  }

  private _processDeferredKeyupEvent(e: KeyboardEvent): void
  {
    const keyCode = e.code as KeyCode;

    // check named binds
    Object.entries(this.options.binds).forEach(([ name, keys ]) =>
    {
      if (!keys.includes(keyCode)) return;

      this._emitter.emit("bindup", {
        device: this,
        keyCode,
        keyLabel: this.getLabel(keyCode),
        event: e,
        name: name,
        repeat: e.repeat,
      });
    });
  }
}
