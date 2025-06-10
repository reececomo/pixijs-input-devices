import { CustomDevice } from "./devices/CustomDevice";
import { GamepadDevice } from "./devices/gamepads/GamepadDevice";
import { Keyboard, KeyboardDevice } from "./devices/keyboard/KeyboardDevice";
import { EventEmitter, EventOptions } from "./utils/events";
import { isMobile } from "./utils/isMobile";


export interface InputDeviceEvent
{
  deviceadded: { device: Device },
  deviceremoved: { device: Device },
  lastdevicechanged: { device: Device },
}

export type Device = GamepadDevice | KeyboardDevice | CustomDevice;

export type NamedBindEvent<BindName extends string = string> = {
  device: Device;
  name: BindName;
}

class InputDeviceManager
{
    public static global = new InputDeviceManager();

    // ----- Context capabilities: -----

    /** Whether the window context is detected as having a mouse-like pointer. */
    public readonly hasMouseLikePointer: boolean =
        window.matchMedia("(pointer: fine) and (hover: hover)").matches;

    /** Whether the window context is a touchscreen. */
    public readonly isTouchCapable: boolean =
        ("ontouchstart" in window || window.TouchEvent) && navigator.maxTouchPoints > 0;

    /** Whether the window context is detected as mobile. */
    public readonly isMobile: boolean = isMobile();

    // ----- Global devices: -----

    /**
     * Global keyboard interface (for all virtual & physical keyboards).
     */
    public readonly keyboard = Keyboard;

    // ----- Global options: -----

    /**
     * Options that apply to input devices.
     */
    public options = {
        /**
         * When the window loses focus, this triggers the clear
         * input function.
         */
        clearInputOnBackground: true,

        /**
         * Require window/document to be in foreground.
         */
        requireDocumentFocus: true,
    };

    // ----- Internal: -----

    private readonly _devices: Device[] = [];

    // gamepads:
    private readonly _gamepads: GamepadDevice[] = [];
    private readonly _gamepadIdx = new Map<number, GamepadDevice>();

    // custom devices:
    private readonly _custom: CustomDevice[] = [];

    // events:
    private readonly _emitter = new EventEmitter<InputDeviceEvent>();
    private readonly _bindDownEmitter = new EventEmitter<Record<string, NamedBindEvent>>();

    // state:
    private _hasFocus: boolean = false;
    private _lastInteractedDevice?: Device;

    private constructor()
    {
        // Keyboard:
        //   Auto-register as the default device in a desktop-like environment.
        //   Otherwise wait until first usage to activate instead.
        if (!this.isMobile && this.hasMouseLikePointer) this.add(this.keyboard);
        else
        {
            window.addEventListener(
                "keydown",
                () => this.add(this.keyboard),
                { once: true }
            );
        }

        // Gamepads:
        //   Listen for connect/disconnect events.
        window.addEventListener("gamepadconnected", (event) =>
        {
            const device = new GamepadDevice(event.gamepad);
            this.add(device);
        });

        window.addEventListener("gamepaddisconnected", (event) =>
        {
            const device = this._gamepadIdx.get(event.gamepad.index);
            if (device) this.remove(device);
        });

    }

    /**
     * Connected devices.
     *
     * Keep in mind these inputs may only be up-to-date from the last update().
     */
    public get devices(): readonly Device[]
    {
        return this._devices;
    }

    /**
     * Connected gamepads accessible by index.
     *
     * Keep in mind these inputs are only up-to-date from the last update().
     */
    public get gamepads(): readonly GamepadDevice[]
    {
        return this._gamepads;
    }

    /**
     * Connected custom devices.
     *
     * Keep in mind these inputs may only be up-to-date from the last update().
     */
    public get custom(): readonly CustomDevice[]
    {
        return this._custom;
    }

    /**
     * The device with the most recent interaction.
     */
    public get lastInteractedDevice(): Device | undefined
    {
        return this._lastInteractedDevice;
    }

    // ----- Events: -----

    /** Add an event listener */
    public on<K extends keyof InputDeviceEvent>(
        event: K,
        listener: (event: InputDeviceEvent[K]) => void
    ): this
    {
        this._emitter.on(event, listener);

        return this;
    }

    /** Remove an event listener (or all if none provided) */
    public off<K extends keyof InputDeviceEvent>(
        event: K,
        listener: (event: InputDeviceEvent[K]) => void
    ): this
    {
        this._emitter.off(event, listener);

        return this;
    }

    /** Adds a named bind event listener. */
    public onBindDown<N extends string>(
        name: N | readonly N[],
        listener: (event: NamedBindEvent<N>) => void,
        options?: EventOptions,
    ): this
    {
        name = Array.isArray(name) ? name : [name];
        name.forEach(n => this._bindDownEmitter.on(n, listener, options));

        return this;
    }

    /** Remove a named bind event listener (or all if none provided). */
    public offBindDown(
        name: string | string[],
        listener?: (event: NamedBindEvent) => void
    ): this
    {
        name = Array.isArray(name) ? name : [name];
        name.forEach(n => this._bindDownEmitter.off(n, listener));

        return this;
    }

    /** Report a named bind event (from a CustomDevice). */
    public emitBindDown(e: NamedBindEvent): void
    {
        this._bindDownEmitter.emit(e.name, e);
    }

    // ----- Devices: -----

    /**
     * Add a device.
     */
    public add(device: Device): void
    {
        if (this._devices.indexOf(device) !== -1)
        {
            return; // device already added!
        }

        this._devices.push(device);

        if (device instanceof KeyboardDevice)
        {
            // keyboard is marked as detected
            device.detected = true;

            // forward named bind events
            device.on("binddown", (e) => this.emitBindDown(e));
        }
        else if (device instanceof GamepadDevice)
        {
            this._gamepadIdx.set(device.source.index, device);
            this._gamepads.push(device);

            // forward named bind events
            device.on("binddown", (e) => this.emitBindDown(e));
        }
        else
        {
            // custom devices are respon
            this._custom.push(device);
        }

        this._emitter.emit("deviceadded", { device });
    }

    /**
     * Remove a device from the available devices.
     */
    public remove(device: Device): void
    {
        if (device instanceof KeyboardDevice)
        {
            device.detected = false;
        }
        else if (device instanceof GamepadDevice)
        {
            this._gamepadIdx.delete(device.source.index);

            const gamepadsIndex = this._gamepads.indexOf(device);
            if (gamepadsIndex !== -1) this._gamepads.splice(gamepadsIndex, 1);
        }
        else
        {
            // custom device
            const customIndex = this._custom.indexOf(device);
            if (customIndex !== -1)
            {
                this._custom.splice(customIndex, 1);
            }
        }

        // remove device
        const devicesIndex = this._devices.indexOf(device);
        if (devicesIndex !== -1)
        {
            this._devices.splice(devicesIndex, 1);
            this._emitter.emit("deviceremoved", { device });
        }
    }

    // ----- Update loop: -----

    /**
     * Performs a poll of latest input from all devices
     */
    public update(): ReadonlyArray<Device>
    {
        if (this.options.requireDocumentFocus && ! document.hasFocus())
        {
            // early exit: window not in focus

            if (this._hasFocus && this.options.clearInputOnBackground)
            {
                // clear input when focus is lost
                this.devices.forEach(device => device.clear?.());
            }

            this._hasFocus = false;

            return this._devices;
        }

        this._hasFocus = true;
        const now = performance.now();

        // poll inputs
        if (this.keyboard.detected)         this.keyboard.update(now);
        if (this._gamepads.length > 0)      this._pollGamepads(now);
        for (const custom of this._custom)  custom.update(now);
        this._updateLastInteracted();

        return this._devices;
    }

    private _updateLastInteracted(): void
    {
        if (this._devices.length === 0) return;

        let last: Device;
        if (this._devices.length === 1)
        {
            last = this._devices[0]!;
        }
        else
        {
            for (const device of this._devices)
            {
                if (
                    last === undefined
                    || device.lastInteraction > last.lastInteraction
                )
                {
                    last = device;
                }
            }
        }

        if (last !== this._lastInteractedDevice)
        {
            // emit an event
            this._emitter.emit("lastdevicechanged", { device: last });
        }

        this._lastInteractedDevice = last;
    }

    // ----- Implementation: -----

    private _pollGamepads(now: number): void
    {
        if (navigator.getGamepads == null) return;

        for (const source of navigator.getGamepads())
        {
            if (source == null) continue;
            this._gamepadIdx.get(source.index)?.update(source, now);
        }
    }
}

export const InputDevice = InputDeviceManager.global;
