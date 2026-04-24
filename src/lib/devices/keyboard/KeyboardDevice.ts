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
import { IBind } from "../../config/DeviceBinds";
import { IDeviceMetadata } from "../../config/DeviceMetadata";


export { KeyCode, KeyboardLayout };

export interface KeyboardDeviceKeyEvent {
  event: KeyboardEvent,
  device: KeyboardDeviceInstance,
  keyCode: KeyCode,
  /** Layout-specific label for key. @example "Ц" // JCUKEN for "KeyW" */
  keyLabel: string,
}

export interface KeyboardDeviceLayoutUpdatedEvent {
  device: KeyboardDeviceInstance;
  layout: KeyboardLayout;
  layoutSource: KeyboardLayoutSource;
}

export interface KeyboardDeviceNamedBindKeyEvent extends KeyboardDeviceKeyEvent
{
  name: IBind;
  pressed: boolean;
  value: 0 | 1;
  repeat: boolean;
}

/** Symmetric short-name alias. */
export type KeyboardKeyEvent = KeyboardDeviceKeyEvent;
/** Symmetric short-name alias. */
export type KeyboardBindEvent = KeyboardDeviceNamedBindKeyEvent;

export interface KeyboardDeviceBindsChangedEvent
{
  device: KeyboardDeviceInstance;
}

export type KeyboardDeviceEvent = {
  layoutdetected: KeyboardDeviceLayoutUpdatedEvent;
  binddown: KeyboardDeviceNamedBindKeyEvent;
  bindup: KeyboardDeviceNamedBindKeyEvent;
  bindschanged: KeyboardDeviceBindsChangedEvent;
} & {
  [key in KeyCode]: KeyboardDeviceKeyEvent;
};

export class KeyboardDeviceInstance
{
    public static global = new KeyboardDeviceInstance();

    /**
     * Setup named binds on the global keyboard device.
     * Mirrors `GamepadDevice.configureDefaultBinds()` for API symmetry.
     */
    public static configureDefaultBinds<B extends IBind>(
        binds: Partial<Record<B, KeyCode[]>>
    ): void
    {
        KeyboardDeviceInstance.global.configureBinds(binds);
    }

    public readonly type = "keyboard";
    public readonly id = "keyboard";

    /**
     * Associate custom meta data with a device.
     */
    public readonly meta: IDeviceMetadata = {};

    /** Timestamp of when the keyboard was last interacted with. */
    public lastInteraction = performance.now();

    /**
     * Keyboard has been detected.
     *
     * This is true on devices where keyboard is the default device, or on
     * other devices when a keyboard is first interacted with.
     */
    public detected: boolean = false;

    /**
     * Keyboard configuration otpions.
     */
    public options = {
    /**
     * When set to false, events are not emitted (excluding layout detection).
     * @default true,
     */
        emitEvents: true,

        /**
         * Whether this keyboard is allowed to check keypresses for the layout.
         *
         * This is only used when the browser does not provide it, and it is not
         * set manually.
         *
         * Checks "keydown" events until the layout is determined.
         */
        detectLayoutOnKeypress: true,

        /**
         * Set binds using `device.configureBinds()`
         *
         * @readonly
         */
        binds: {
            "NavigateBack"      :  [ "Escape", "Backspace" ],
            "NavigateDown"      :  [ "ArrowDown", "KeyS" ],
            "NavigateLeft"      :  [ "ArrowLeft", "KeyA" ],
            "NavigateRight"     :  [ "ArrowRight", "KeyD" ],
            "NavigateActivate"  :  [ "Enter", "Space" ],
            "NavigateUp"        :  [ "ArrowUp", "KeyW" ],
        } as Partial<Record<IBind, KeyCode[]>>,

        /**
     * These are the binds that are allowed to repeat when a key
     * is held down.
     *
     * @default ["NavigateDown", "NavigateLeft", "NavigateRight", "NavigateUp"]
     */
        repeatableBinds: [
            "NavigateDown",
            "NavigateLeft",
            "NavigateRight",
            "NavigateUp",
        ],
    };

    /** Accessors for keys */
    public key: Record<KeyCode, boolean> =
        Object.keys(KeyCode).reduce((obj, key) =>
        {
            obj[key] = false;

            return obj;
        }, {} as any);

    private readonly _emitter = new EventEmitter<KeyboardDeviceEvent>();
    private readonly _bindDownEmitter = new EventEmitter<Record<string, KeyboardDeviceNamedBindKeyEvent>>();
    private readonly _bindUpEmitter = new EventEmitter<Record<string, KeyboardDeviceNamedBindKeyEvent>>();

    private _layout: KeyboardLayout;
    private _layoutSource: KeyboardLayoutSource;
    private _deferredKeydown: KeyboardEvent[] = [];
    private _deferredKeyup: KeyboardEvent[] = [];

    /**
     * Reverse index: KeyCode -> list of bind names using that code.
     * Rebuilt on configureBinds/importBinds so dispatch is O(1).
     */
    private _bindIndex: Map<KeyCode, string[]> = new Map();

    // Edge-detection snapshots for bindPressed/bindReleased.
    // Two Sets swapped each update() to avoid per-frame allocation.
    private _bindsDownCurr: Set<string> = new Set();
    private _bindsDownPrev: Set<string> = new Set();

    private constructor()
    {
        this._layout = inferKeyboardLayoutFromLang();
        this._layoutSource = "lang";
        this._rebuildBindIndex();

        // auto-detect layout
        requestKeyboardLayout().then(layout =>
        {
            if (layout === undefined) return; // not detected

            this._layoutSource = "browser";
            this._layout = layout;

            this.options.detectLayoutOnKeypress = false;

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
        this.options.detectLayoutOnKeypress = false;
    }

    /** How the keyboard layout was determined. */
    public get layoutSource(): KeyboardLayoutSource
    {
        return this._layoutSource;
    }

    // ----- Methods: -----

    /** @returns true if any KeyCode from the named bind is pressed. */
    public bindDown(name: IBind): boolean
    {
        if (this.options.binds[name] === undefined) return false;

        return this.pressedAny(this.options.binds[name]);
    }

    /**
     * @returns true if the named bind transitioned from up to down since the
     * last `update()` call (i.e. "just pressed this frame").
     */
    public bindPressed(name: IBind): boolean
    {
        return this._bindsDownCurr.has(name) && !this._bindsDownPrev.has(name);
    }

    /**
     * @returns true if the named bind transitioned from down to up since the
     * last `update()` call (i.e. "just released this frame").
     */
    public bindReleased(name: IBind): boolean
    {
        return !this._bindsDownCurr.has(name) && this._bindsDownPrev.has(name);
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

    /** Set custom binds (merges with existing binds). */
    public configureBinds<B extends IBind>(
        binds: Partial<Record<B, KeyCode[]>>
    ): void
    {
        this.options.binds = {
            ...this.options.binds,
            ...binds,
        };
        this._rebuildBindIndex();
    }

    /**
     * Export current binds as a plain JSON-serializable object.
     * Useful for saving/restoring custom control schemes.
     */
    public exportBinds(): Record<string, KeyCode[]>
    {
        const out: Record<string, KeyCode[]> = {};

        for (const name in this.options.binds)
        {
            const keys = this.options.binds[name as IBind];
            if (keys) out[name] = [...keys];
        }

        return out;
    }

    /**
     * Import binds from a plain object (e.g. parsed from JSON).
     *
     * @param binds  - The bind map to import.
     * @param mode   - `"replace"` (default) discards current binds first;
     *                 `"merge"` keeps existing binds, overwriting only the
     *                  keys present in the supplied map.
     */
    public importBinds(
        binds: Record<string, KeyCode[]>,
        mode: "merge" | "replace" = "replace"
    ): void
    {
        this.options.binds = mode === "replace"
            ? { ...binds } as Partial<Record<IBind, KeyCode[]>>
            : { ...this.options.binds, ...binds };

        this._rebuildBindIndex();
        this._emitter.emit("bindschanged", { device: this });
    }

    /** Haptics not supported on default keyboard. */
    public playHaptic(): void
    {
        // no vibration support
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
        name: IBind,
        listener: (event: KeyboardDeviceNamedBindKeyEvent) => void,
        options?: EventOptions,
    ): this
    {
        this._bindDownEmitter.on(name, listener, options);

        return this;
    }

    /** Remove a named bind event listener (or all if none provided). */
    public offBindDown(
        name: IBind,
        listener?: (event: KeyboardDeviceNamedBindKeyEvent) => void
    ): this
    {
        this._bindDownEmitter.off(name, listener);

        return this;
    }

    /** Add a named bind event listener (or all if none provided). */
    public onBindUp(
        name: IBind,
        listener: (event: KeyboardDeviceNamedBindKeyEvent) => void,
        options?: EventOptions,
    ): this
    {
        this._bindUpEmitter.on(name, listener, options);

        return this;
    }

    /** Remove a named bind event listener (or all if none provided). */
    public offBindUp(
        name: IBind,
        listener?: (event: KeyboardDeviceNamedBindKeyEvent) => void
    ): this
    {
        this._bindUpEmitter.off(name, listener);

        return this;
    }

    /** Add a named bind event listener (or all if none provided). */
    public onBind(
        name: IBind,
        listener: (event: KeyboardDeviceNamedBindKeyEvent) => void,
        options?: EventOptions,
    ): this
    {
        return this.onBindUp(name, listener, options);
    }

    /** Remove a named bind event listener (or all if none provided). */
    public offBind(
        name: IBind,
        listener?: (event: KeyboardDeviceNamedBindKeyEvent) => void
    ): this
    {
        return this.offBindDown(name, listener).offBindUp(name, listener);
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
     * keyboard.getKeyLabel("KeyZ") === "W" // AZERTY
     * keyboard.getKeyLabel("KeyZ") === "Я" // JCUKEN
     * keyboard.getKeyLabel("KeyZ") === "Z" // QWERTY
     * keyboard.getKeyLabel("KeyZ") === "Y" // QWERTZ
     */
    public getKeyLabel(key: KeyCode, layout?: KeyboardLayout): string
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
        if (this._deferredKeydown.length > 0)
        {
            this._deferredKeydown.forEach((event) => this._processDeferredKeydownEvent(event));
            this._deferredKeydown.length = 0;
        }

        if (this.options.emitEvents && this._deferredKeyup.length > 0)
        {
            this._deferredKeyup.forEach((event) => this._emitDeferredKeyupEvent(event));
            this._deferredKeyup.length = 0;
            this.lastInteraction = now;
        }

        // Snapshot bind state for bindPressed()/bindReleased() edge detection.
        // Swap the two Sets so prev becomes curr's backing storage (no alloc).
        const tmp = this._bindsDownPrev;
        this._bindsDownPrev = this._bindsDownCurr;
        this._bindsDownCurr = tmp;
        this._bindsDownCurr.clear();

        for (const [code, names] of this._bindIndex)
        {
            if (this.key[code])
            {
                for (let i = 0; i < names.length; i++)
                {
                    this._bindsDownCurr.add(names[i]!);
                }
            }
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
        const u = this._deferredKeyup;

        window.addEventListener(
            "keydown",
            e =>
            {
                k[e.code] = true;
                d.push(e);
                this.lastInteraction = performance.now();
            },
            { passive: true, capture: true }
        );

        window.addEventListener(
            "keyup",
            e =>
            {
                k[e.code] = false;
                u.push(e);
                this.lastInteraction = performance.now();
            },
            { passive: true, capture: true }
        );
    }

    private _processDeferredKeydownEvent(e: KeyboardEvent): void
    {
        const keyCode = e.code as KeyCode;

        if (!e.repeat)
        {
            // detect keyboard layout
            if (
                this.options.detectLayoutOnKeypress
                && this._layoutSource === "lang"
            )
            {
                const layout = detectKeyboardLayoutFromKeydown(e);
                if (layout !== undefined)
                {
                    this._layout = layout;
                    this._layoutSource = "keypress";
                    this.options.detectLayoutOnKeypress = false;

                    this._emitter.emit("layoutdetected", {
                        layout: layout,
                        layoutSource: "keypress",
                        device: this,
                    });
                }
            }

            // dispatch events
            if (this.options.emitEvents && this._emitter.hasListener(keyCode))
            {
                this._emitter.emit(keyCode, {
                    device: this,
                    keyCode,
                    keyLabel: this.getKeyLabel(keyCode),
                    event: e,
                });
            }
        }

        if (this.options.emitEvents)
        {
            // Use pre-built index for O(1) bind lookup (no Object.entries scan).
            const names = this._bindIndex.get(keyCode);

            if (names)
            {
                const keyLabel = this.getKeyLabel(keyCode);

                for (let i = 0; i < names.length; i++)
                {
                    const name = names[i]!;

                    if (e.repeat && !this.options.repeatableBinds.includes(name))
                    {
                        continue;
                    }

                    const event = {
                        device: this,
                        keyCode,
                        keyLabel,
                        event: e,
                        name: name as IBind,
                        repeat: e.repeat,
                        value: 1 as const,
                        pressed: true,
                    };

                    this._bindDownEmitter.emit(name, event);
                    this._emitter.emit("binddown", event);
                }
            }
        }
    }

    private _emitDeferredKeyupEvent(e: KeyboardEvent): void
    {
        const keyCode = e.code as KeyCode;

        // Use pre-built index for O(1) bind lookup.
        const names = this._bindIndex.get(keyCode);

        if (names)
        {
            const keyLabel = this.getKeyLabel(keyCode);

            for (let i = 0; i < names.length; i++)
            {
                const name = names[i]!;
                const event = {
                    device: this,
                    keyCode,
                    keyLabel,
                    event: e,
                    name: name as IBind,
                    repeat: e.repeat,
                    value: 0 as const,
                    pressed: false,
                };

                this._bindUpEmitter.emit(name, event);
                this._emitter.emit("bindup", event);
            }
        }
    }

    /**
     * Rebuild the reverse index: KeyCode -> bind names[].
     * Called on init and whenever binds change.
     */
    private _rebuildBindIndex(): void
    {
        this._bindIndex.clear();

        for (const name in this.options.binds)
        {
            const keys = this.options.binds[name as IBind];
            if (!keys) continue;

            for (const key of keys)
            {
                let list = this._bindIndex.get(key);

                if (!list)
                {
                    list = [];
                    this._bindIndex.set(key, list);
                }

                list.push(name);
            }
        }
    }
}

export const KeyboardDevice = KeyboardDeviceInstance.global;

/** Serialized bind snapshot used by exportBinds/importBinds. */
export type SerializedKeyboardBinds = Record<string, KeyCode[]>;
