/* eslint-disable brace-style */

import { Axis, AxisCode, Button, ButtonCode } from "./buttons";
import { detectLayout, GamepadLayout } from "./layouts";
import { EventEmitter, EventOptions } from "../../utils/events";
import { GamepadHapticManager } from "./GamepadHapticManager";
import { HapticEffect } from "../HapticEffect";
import { NavigateBind } from "../../navigation/NavigateBind";
import { Options } from "../../utils/Options";
import { IBind } from "../../config/DeviceBinds";
import { IDeviceMetadata } from "../../config/DeviceMetadata";


export { Button, GamepadLayout };

export type GamepadButtonDownEvent = (gamepad: GamepadDevice, button: Button) => void;

export interface GamepadButtonEvent {
  device: GamepadDevice;
  button: Button;
  buttonCode: ButtonCode;
  pressed: boolean;
  value: 0 | 1;
}

export interface GamepadAxisEvent {
  device: GamepadDevice;
  axis: Axis;
  axisCode: AxisCode;
  pressed: boolean;
  value: number;
}

/** Symmetric short-name alias. */
export type GamepadBindEvent = GamepadNamedBindEvent;

export interface GamepadDeviceBindsChangedEvent
{
  device: GamepadDevice;
}

export type GamepadNamedBindEvent = {
  type: "button";
  device: GamepadDevice;
  name: IBind;
  pressed: boolean;
  value: 0 | 1;
  button: Button;
  buttonCode: ButtonCode;
} | {
  type: "axis";
  device: GamepadDevice;
  name: IBind;
  pressed: boolean;
  value: number;
  axis: Axis;
  axisCode: AxisCode;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type GamepadDeviceEvent = {
  binddown: GamepadNamedBindEvent;
  bindup: GamepadNamedBindEvent;
  bindschanged: GamepadDeviceBindsChangedEvent;
} & {
  [axis in AxisCode]: GamepadAxisEvent;
} & {
  [button in ButtonCode]: GamepadButtonEvent;
};

/**
 * Bindable codes for button and joystick events.
 */
export type GamepadCode = ButtonCode | AxisCode;

/**
 * A gamepad (game controller).
 *
 * Provides bindings and accessors for standard controller/gamepad layout:
 * - 2 Joysticks: `leftJoystick`, `rightJoystick`
 * - 16 Buttons: `button[...]`
 *
 * Direct Gamepad API access available too, via `source`.
 */
export class GamepadDevice
{
    /**
     * Setup named binds for all newly connecting gamepads.
     * Already-connected gamepads are not affected; call `configureBinds()`
     * on individual instances to update them.
     */
    public static configureDefaultBinds<BindName extends IBind = IBind>(
        binds: Partial<Record<BindName, GamepadCode[]>>,
    ): void
    {
        this.defaultOptions.binds = {
            ...this.defaultOptions.binds,
            ...binds,
        };
    }

    public static defaultOptions = {
        /**
         * When set to false, events are not emitted.
         * @default true,
         */
        emitEvents: true,

        /**
         * Joystick configuration.
         */
        joystick: {
            /**
             * Sensitivity deadzone
             *
             * The range of movement in a joystick recognized as input, to
             * prevent unintended movements caused by imprecision or wear.
             *
             * @default [ 0.0, 1.0 ]
             */
            deadzone: [0, 1] satisfies [ min: number, max: number ],

            /**
             * Press threshold
             *
             * The point within the deadzone when a joystick axis is considered pressed.
             *
             * @default 0.5
             */
            pressThreshold: 0.5,

            /**
             * The amount of time (in milliseconds) between emitting axis events in a
             * given direction, given as [first, subsequent].
             *
             * @default [ delay: 400, repeat: 100 ]
             */
            autoRepeatDelayMs: [400, 100] satisfies [ delay: number, subsequent: number ],
        },

        /**
         * Trigger configuration.
         */
        trigger: {
            /**
             * Sensitivity deadzone
             *
             * The range of movement in a trigger recognized as input, to
             * revent unintended movements caused by imprecision or wear.
             *
             * @default [ 0.0, 1.0 ]
             */
            deadzone: [0, 1] satisfies [ min: number, max: number ],
        },

        /**
         * Vibration configuration.
         */
        vibration: {
            /**
             * Whether vibration is enabled (when available).
             *
             * @default true
             */
            enabled: true,

            /**
             * Global intensity of vibrations, between 0.0 and 1.0.
             *
             * @default 1.0
             */
            intensity: 1,
        },

        /**
         * Set binds using `device.configureBinds()` or
         * `GamepadDevice.configureDefaultBinds()`
         *
         * @readonly
         */
        binds: {
            "NavigateActivate"  : [ "Face1" ],
            "NavigateBack"      : [ "Face2" ],
            "NavigateUp"        : [ "DpadUp", "LeftStickUp" ],
            "NavigateLeft"      : [ "DpadLeft", "LeftStickLeft" ],
            "NavigateDown"      : [ "DpadDown", "LeftStickDown" ],
            "NavigateRight"     : [ "DpadRight", "LeftStickRight" ],
        } as Partial<Record<IBind, GamepadCode[]>>,
    };

    /**
     * Globally unique identifier for this gamepad slot.
     * @example "gamepad0"
     */
    public readonly id: string;
    public readonly type = "gamepad";

    /**
     * Associate custom meta data with a device.
     */
    public readonly meta: IDeviceMetadata = {};

    /**
     * When the gamepad was last interacted with.
     */
    public lastInteraction = performance.now();

    /**
     * Platform of this gamepad, useful for configuring standard
     * button layouts or displaying branded icons.
     * @example "playstation"
     */
    public readonly layout: GamepadLayout;

    /**
     * Whether the gamepad reports that trigger rumble is supported.
     */
    public readonly supportsTriggerRumble: boolean;

    /**
     * Gamepad configuration options.
     */
    public options: typeof GamepadDevice.defaultOptions =
        JSON.parse(JSON.stringify(GamepadDevice.defaultOptions)); // clone

    // ----- Joysticks: -----

    public readonly leftJoystick = { x: 0, y: 0 };
    public readonly rightJoystick = { x: 0, y: 0 };

    // ----- Buttons: -----

    /** Accessors for buttons */
    public button: Record<AxisCode | ButtonCode, boolean> =
        [...ButtonCode, ...AxisCode ].reduce((obj, key) =>
        {
            obj[key] = false;

            return obj;
        }, {} as any);

    // ----- Triggers: -----

    /** A scalar 0.0 to 1.0 representing the left trigger value */
    public leftTrigger = 0;

    /** A scalar 0.0 to 1.0 representing the right trigger value */
    public rightTrigger = 0;

    /** A scalar 0.0 to 1.0 representing the left shoulder value */
    public leftShoulder = 0;

    /** A scalar 0.0 to 1.0 representing the right shoulder value */
    public rightShoulder = 0;

    // ----- Internal: -----

    private readonly _haptics: GamepadHapticManager | undefined;
    private readonly _emitter = new EventEmitter<GamepadDeviceEvent>();
    private readonly _bindDownEmitter = new EventEmitter<Record<IBind, GamepadNamedBindEvent>>();
    private readonly _bindUpEmitter = new EventEmitter<Record<IBind, GamepadNamedBindEvent>>();
    private readonly _debounces = new Map<GamepadCode, number>();

    /**
     * Reverse index: GamepadCode -> list of bind names using that code.
     * Rebuilt on configureBinds/importBinds so dispatch is O(1).
     */
    private _bindIndex: Map<GamepadCode, string[]> = new Map();

    // Edge-detection snapshots for bindPressed/bindReleased.
    // Two Sets swapped each update() to avoid per-frame allocation.
    private _bindsDownCurr: Set<string> = new Set();
    private _bindsDownPrev: Set<string> = new Set();

    public constructor(public source: Gamepad)
    {
        this.id = "gamepad" + source.index;
        this.layout = detectLayout(source?.id) ?? "unknown";
        this._haptics = new GamepadHapticManager(source);
        this.supportsTriggerRumble = this._haptics.hapticEvent === "trigger-rumble";
        this._rebuildBindIndex();
    }

    // ----- Button helpers: -----

    /** @returns true if any button from the named bind is pressed. */
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

    /** @returns true if any of the given buttons are pressed. */
    public pressedAny(btns: GamepadCode[]): boolean
    {
        for (let i = 0; i < btns.length; i++)
        {
            if (this.button[btns[i]!]) return true;
        }

        return false;
    }

    /** @returns true if all of the given buttons are pressed. */
    public pressedAll(btns: GamepadCode[]): boolean
    {
        for (let i = 0; i < btns.length; i++)
        {
            if (!this.button[btns[i]!]) return false;
        }

        return true;
    }

    /** Set named binds for this gamepad (merges with existing binds). */
    public configureBinds<BindName extends string = string | NavigateBind>(
        binds: Partial<Record<BindName, GamepadCode[]>>
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
    public exportBinds(): Record<string, GamepadCode[]>
    {
        const out: Record<string, GamepadCode[]> = {};

        for (const name in this.options.binds)
        {
            const codes = this.options.binds[name as IBind];
            if (codes) out[name] = [...codes];
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
        binds: Record<string, GamepadCode[]>,
        mode: "merge" | "replace" = "replace"
    ): void
    {
        this.options.binds = mode === "replace"
            ? { ...binds } as Partial<Record<IBind, GamepadCode[]>>
            : { ...this.options.binds, ...binds };

        this._rebuildBindIndex();
        this._emitter.emit("bindschanged", { device: this });
    }

    // ----- Events: -----

    /** Add an event listener */
    public on<K extends keyof GamepadDeviceEvent>(
        event: K,
        listener: (event: GamepadDeviceEvent[K]) => void,
        options?: EventOptions,
    ): this
    {
        this._emitter.on(event, listener, options);

        return this;
    }

    /** Remove an event listener (or all if none provided). */
    public off<K extends keyof GamepadDeviceEvent>(
        event: K,
        listener?: (event: GamepadDeviceEvent[K]) => void
    ): this
    {
        this._emitter.off(event, listener);

        return this;
    }

    /** Add a named bind event listener (or all if none provided). */
    public onBindDown(
        name: IBind,
        listener: (event: GamepadNamedBindEvent) => void,
        options?: EventOptions,
    ): this
    {
        this._bindDownEmitter.on(name, listener, options);

        return this;
    }

    /** Remove a named bind event listener (or all if none provided). */
    public offBindDown(
        name: IBind,
        listener?: (event: GamepadNamedBindEvent) => void
    ): this
    {
        this._bindDownEmitter.off(name, listener);

        return this;
    }

    /** Add a named bind event listener (or all if none provided). */
    public onBindUp(
        name: IBind,
        listener: (event: GamepadNamedBindEvent) => void,
        options?: EventOptions,
    ): this
    {
        this._bindUpEmitter.on(name, listener, options);

        return this;
    }

    /** Remove a named bind event listener (or all if none provided). */
    public offBindUp(
        name: IBind,
        listener?: (event: GamepadNamedBindEvent) => void
    ): this
    {
        this._bindUpEmitter.off(name, listener);

        return this;
    }

    /** Add a named bind event listener (or all if none provided). */
    public onBind(
        name: IBind,
        listener: (event: GamepadNamedBindEvent) => void,
        options?: EventOptions,
    ): this
    {
        return this.onBindUp(name, listener, options);
    }

    /** Remove a named bind event listener (or all if none provided). */
    public offBind(
        name: IBind,
        listener?: (event: GamepadNamedBindEvent) => void
    ): this
    {
        return this.offBindDown(name, listener).offBindUp(name, listener);
    }

    // ----- Vibration: -----

    /**
     * Play a haptic effect (when supported).
     */
    public playHaptic(...effects: HapticEffect[]): void
    {
        if (!this.options.vibration.enabled) return;

        if (
            Options.supressHapticsInactivityPeriodMs > 0
            && performance.now() - this.lastInteraction > Options.supressHapticsInactivityPeriodMs
        )
        {
            return; // haptics are muted
        }

        effects.forEach((effect) => this._haptics.play(effect, this.options.vibration.intensity));
    }

    /**
     * Stop all haptic effects.
     */
    public stopHaptics(): void
    {
        this._haptics.reset();
    }

    // ----- Lifecycle: -----

    public update(source: Gamepad, now: number): void
    {
        this.source = source;
        this._poll(source, now);
        this._haptics.update();
        this._snapshotBindState();
    }

    public clear(): void
    {
        this.button = [...AxisCode, ...ButtonCode].reduce((obj, key) =>
        {
            obj[key] = false;

            return obj;
        }, {} as any);

        this._haptics.reset();
    }

    private _poll(source: Gamepad, now: number): void
    {
        const axisCount = 4;
        const buttonCount = 16;
        const joy = this.options.joystick;

        // axis
        for (let a = 0; a < axisCount; a++)
        {
            const value = _scale(source.axes[a], joy.deadzone);
            const axisCode = AxisCode[a * 2 + (value > 0 ? 1 : 0)];

            if (Math.abs(value) < joy.pressThreshold)
            {
                if (this.button[axisCode])
                {
                    // emit events
                    if (this.options.emitEvents)
                    {
                        // check named bind events (O(1) via precomputed index)
                        const upNames = this._bindIndex.get(axisCode);

                        if (upNames)
                        {
                            for (let n = 0; n < upNames.length; n++)
                            {
                                const bindName = upNames[n]! as IBind;
                                const event: GamepadNamedBindEvent = {
                                    device: this,
                                    type: "axis",
                                    axis: a as Axis,
                                    axisCode,
                                    name: bindName,
                                    pressed: false,
                                    value,
                                };

                                this._bindUpEmitter.emit(bindName, event);
                                this._emitter.emit("bindup", event);
                            }
                        }
                    }
                }
                else
                {
                    this._debounces.delete(axisCode);
                }

                this.button[axisCode] = false;
            }
            else
            {
                const delayMs = joy.autoRepeatDelayMs[+this.button[axisCode]];

                if (this._debounce(axisCode, delayMs) && this.button[axisCode])
                {
                    continue;
                }

                this.button[axisCode] = true;
                this.lastInteraction = now;

                // emit events
                if (this.options.emitEvents)
                {
                    if (this._emitter.hasListener(axisCode))
                    {
                        this._emitter.emit(axisCode, {
                            device: this,
                            axis: a as Axis,
                            axisCode,
                            pressed: true,
                            value,
                        });
                    }

                    // check named bind events (O(1) via precomputed index)
                    const downNames = this._bindIndex.get(axisCode);

                    if (downNames)
                    {
                        for (let n = 0; n < downNames.length; n++)
                        {
                            const bindName = downNames[n]! as IBind;
                            const event: GamepadNamedBindEvent = {
                                device: this,
                                type: "axis",
                                axis: a as Axis,
                                axisCode,
                                name: bindName,
                                pressed: true,
                                value,
                            };

                            this._bindDownEmitter.emit(bindName, event);
                            this._emitter.emit("binddown", event);
                        }
                    }
                }
            }
        }

        // buttons
        for (let _b = 0; _b < buttonCount; _b++)
        {
            let b = _b as Button;

            const buttonCode = ButtonCode[b];

            if (this.button[buttonCode] === source.buttons[_b]?.pressed)
            {
                continue; // skip: no change
            }

            this.lastInteraction = now;

            // update
            const isPressed = source.buttons[_b]?.pressed ?? false;
            this.button[buttonCode] = isPressed;

            if (this.options.emitEvents)
            {
                // emit events
                if (isPressed && this._emitter.hasListener(buttonCode))
                {
                    this._emitter.emit(buttonCode, {
                        device: this,
                        button: b,
                        buttonCode,
                        pressed: true,
                        value: 1 as const,
                    });
                }

                // check named bind events (O(1) via precomputed index)
                const btnNames = this._bindIndex.get(buttonCode);

                if (btnNames)
                {
                    for (let n = 0; n < btnNames.length; n++)
                    {
                        const bindName = btnNames[n]! as IBind;
                        const event: GamepadNamedBindEvent = {
                            device: this,
                            type: "button",
                            button: b,
                            buttonCode,
                            name: bindName,
                            pressed: isPressed,
                            value: isPressed ? 1 : 0,
                        };

                        (isPressed ? this._bindDownEmitter : this._bindUpEmitter)
                            .emit(bindName, event);

                        this._emitter
                            .emit(isPressed ? "binddown" : "bindup", event);
                    }
                }
            }
        }

        // triggers
        const tdz = this.options.trigger.deadzone;
        this.leftTrigger = _scale(source.buttons[Button.LeftTrigger].value, tdz);
        this.rightTrigger = _scale(source.buttons[Button.RightTrigger].value, tdz);
        this.leftShoulder = _scale(source.buttons[Button.LeftShoulder].value, tdz);
        this.rightShoulder = _scale(source.buttons[Button.RightShoulder].value, tdz);

        // joysticks
        const jdz = joy.deadzone;
        this.leftJoystick.x = _scale(source.axes[Axis.LeftStickX] ?? 0, jdz);
        this.leftJoystick.y = _scale(source.axes[Axis.LeftStickY] ?? 0, jdz);
        this.rightJoystick.x = _scale(source.axes[Axis.RightStickX] ?? 0, jdz);
        this.rightJoystick.y = _scale(source.axes[Axis.RightStickY] ?? 0, jdz);
    }

    /**
     * Inline relay debouncer.
     * @returns true when already in progress and the operation should be skipped
     */
    private _debounce(key: GamepadCode, delayMs: number): boolean
    {
        const now = Date.now();

        if (
            (this._debounces.get(key) ?? 0) > now
        ) return true;

        this._debounces.set(key, now + delayMs);

        return false;
    }

    /**
     * Snapshot bind state for bindPressed()/bindReleased() edge detection.
     * Called at the end of each update(). Swaps two Sets to avoid allocation.
     */
    private _snapshotBindState(): void
    {
        const tmp = this._bindsDownPrev;
        this._bindsDownPrev = this._bindsDownCurr;
        this._bindsDownCurr = tmp;
        this._bindsDownCurr.clear();

        for (const [code, names] of this._bindIndex)
        {
            if (this.button[code])
            {
                for (let i = 0; i < names.length; i++)
                {
                    this._bindsDownCurr.add(names[i]!);
                }
            }
        }
    }

    /**
     * Rebuild the reverse index: GamepadCode -> bind names[].
     * Called on construction and whenever binds change.
     */
    private _rebuildBindIndex(): void
    {
        this._bindIndex.clear();

        for (const name in this.options.binds)
        {
            const codes = this.options.binds[name as IBind];
            if (!codes) continue;

            for (const code of codes)
            {
                let list = this._bindIndex.get(code);

                if (!list)
                {
                    list = [];
                    this._bindIndex.set(code, list);
                }

                list.push(name);
            }
        }
    }
}

/** Serialized bind snapshot used by exportBinds/importBinds. */
export type SerializedGamepadBinds = Record<string, GamepadCode[]>;

function _scale(value: number, range: [ min: number, max: number ]): number
{
    const scaled = (Math.abs(value) - range[0]) / (range[1] - range[0]);

    return scaled >= 0 && scaled <= 1
        ? Math.sign(value) * scaled
        : scaled > 1 ? Math.sign(value) * 1 : 0;
}
