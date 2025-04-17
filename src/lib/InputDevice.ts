import { CustomDevice } from "./devices/CustomDevice";
import { GamepadDevice } from "./devices/gamepads/GamepadDevice";
import { KeyboardDevice } from "./devices/keyboard/KeyboardDevice";
import { EventEmitter, EventOptions } from "./utils/events";
import { isMobile } from "./utils/isMobile";


export interface InputDeviceEvent {
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

    /** Whether the context has a mouse/trackpad pointer. */
    public readonly hasMouseLikePointer: boolean =
        window.matchMedia("(pointer: fine) and (hover: hover)").matches;

    /** Whether the context is a mobile device. */
    public readonly isMobile: boolean = isMobile();

    /** Whether the context has touchscreen capability. */
    public readonly isTouchCapable: boolean =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;

    // ----- Global devices: -----

    /** Global keyboard interface (for all virtual & physical keyboards). */
    public readonly keyboard: KeyboardDevice = KeyboardDevice.global;

    // ----- Global options: -----

    /** Options that apply to input devices */
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
    private readonly _gamepadDevices: GamepadDevice[] = [];
    private readonly _gamepadDeviceMap = new Map<number, GamepadDevice>();
    private readonly _customDevices: CustomDevice[] = [];
    private readonly _emitter = new EventEmitter<InputDeviceEvent>();
    private readonly _bindDownEmitter = new EventEmitter<Record<string, NamedBindEvent>>();

    private _hasFocus: boolean = false;
    private _lastInteractedDevice?: Device;

    private constructor()
    {
    // gamepads
        window.addEventListener(
            "gamepadconnected",
            () => this._pollGamepads( performance.now() ) // (handles register)
        );
        window.addEventListener(
            "gamepaddisconnected",
            ( event ) => this._removeGamepad( event.gamepad.index )
        );

        // keyboard:
        //   the keyboard interface is always available globally, but is only registered
        //   as "connected" input device (i.e. put into the list of active devices) when
        //   we are confident it is available
        if ( !this.isMobile && this.hasMouseLikePointer )
        {
            // auto-register
            this.add( this.keyboard );
        }
        else
        {
            // defer register until first keydown
            window.addEventListener(
                "keydown",
                () => this.add( this.keyboard ),
                { once: true }
            );
        }
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
        return this._gamepadDevices;
    }

    /**
     * Connected custom devices.
     *
     * Keep in mind these inputs may only be up-to-date from the last update().
     */
    public get custom(): readonly CustomDevice[]
    {
        return this._customDevices;
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
        listener: ( event: NamedBindEvent<N> ) => void,
        options?: EventOptions,
    ): this
    {
        name = Array.isArray( name ) ? name : [name];
        name.forEach( n => this._bindDownEmitter.on( n, listener, options ) );

        return this;
    }

    /** Remove a named bind event listener (or all if none provided). */
    public offBindDown(
        name: string | string[],
        listener?: ( event: NamedBindEvent ) => void
    ): this
    {
        name = Array.isArray( name ) ? name : [name];
        name.forEach( n => this._bindDownEmitter.off( n, listener ) );

        return this;
    }

    /** Report a named bind event (from a CustomDevice). */
    public emitBindDown( e: NamedBindEvent ): void
    {
        this._bindDownEmitter.emit( e.name, e );
    }

    // ----- Devices: -----

    /**
     * Add a device.
     */
    public add( device: Device ): void
    {
        if ( this._devices.indexOf( device ) !== -1 )
        {
            return; // device already added!
        }

        this._devices.push( device );

        if ( device instanceof KeyboardDevice )
        {
            // keyboard is marked as detected
            device.detected = true;

            // forward named bind events
            device.on( "binddown", (e) => this.emitBindDown(e) );
        }
        else if ( device instanceof GamepadDevice )
        {
            this._gamepadDeviceMap.set( device.source.index, device );
            this._gamepadDevices.push( device );

            // forward named bind events
            device.on( "binddown", (e) => this.emitBindDown(e) );
        }
        else
        {
            // custom devices are respon
            this._customDevices.push( device );
        }

        this._emitter.emit( "deviceadded", { device });
    }

    /**
     * Remove a device from the available devices.
     */
    public remove( device: Device ): void
    {
    // remove custom device
        if ( !( device instanceof KeyboardDevice || device instanceof GamepadDevice ) )
        {
            const customIndex = this._customDevices.indexOf( device );
            if ( customIndex !== -1 )
            {
                this._customDevices.splice( customIndex, 1 );
            }
        }

        // remove device
        const devicesIndex = this._devices.indexOf( device );
        if ( devicesIndex !== -1 )
        {
            this._devices.splice( devicesIndex, 1 );
            this._emitter.emit( "deviceremoved", { device });
        }
    }

    // ----- Update loop: -----

    /**
     * Performs a poll of latest input from all devices
     */
    public update(): ReadonlyArray<Device>
    {
        if ( this.options.requireDocumentFocus && ! document.hasFocus() )
        {
            // early exit: window not in focus

            if ( this._hasFocus && this.options.clearInputOnBackground )
            {
                // clear input when focus is lost
                this.devices.forEach( device => device.clear?.() );
            }

            this._hasFocus = false;

            return this._devices;
        }

        this._hasFocus = true;
        const now = performance.now();

        // keyboard
        if ( this.keyboard.detected ) this.keyboard.update( now );

        // gamepads
        if ( this._gamepadDevices.length > 0 )
        {
            this._pollGamepads( now );
        }

        // custom
        if ( this._customDevices.length > 0 )
        {
            this._customDevices.forEach( custom => custom.update( now ) );
        }

        this._updateLastInteracted();

        return this._devices;
    }

    private _updateLastInteracted(): void
    {
        if ( this._devices.length === 0 ) return;

        let last: Device;
        if ( this._devices.length === 1 )
        {
            last = this._devices[0]!;
        }
        else
        {
            for ( const device of this._devices )
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

        if ( last !== this._lastInteractedDevice )
        {
            // emit an event
            this._emitter.emit( "lastdevicechanged", { device: last } );
        }

        this._lastInteractedDevice = last;
    }

    /**
     * @returns updates connected gamepads, performing a poll of latest input
     */
    private _pollGamepads( now: number ): ReadonlyArray<GamepadDevice>
    {
        if ( !document.hasFocus() ) return this._gamepadDevices;
        if ( navigator.getGamepads === undefined ) return this._gamepadDevices;

        for ( const source of navigator.getGamepads() )
        {
            if ( source == null ) continue;

            if ( this._gamepadDeviceMap.has( source.index ) )
            {
                const gamepad = this._gamepadDeviceMap.get( source.index );
                gamepad.update( source, now );
            }
            else
            {
                const gamepad = new GamepadDevice( source );
                this.add( gamepad );
                gamepad.update( source, now );
            }
        }

        return this._gamepadDevices;
    }

    // ----- Implementation: -----

    private _removeGamepad( gamepadIndex: number ): void
    {
        const gamepad = this._gamepadDeviceMap.get( gamepadIndex );
        if ( ! gamepad ) return;

        const gamepadsIndex = this._gamepadDevices.indexOf( gamepad );
        if ( gamepadsIndex !== -1 ) this._gamepadDevices.splice( gamepadsIndex, 1 );

        this.remove( gamepad );
        this._gamepadDeviceMap.delete( gamepadIndex );
    }
}

export const InputDevice = InputDeviceManager.global;
