import { CustomDevice } from "./devices/CustomDevice";
import { GamepadDevice } from "./devices/gamepads/GamepadDevice";
import { KeyboardDevice } from "./devices/keyboard/KeyboardDevice";
import { isMobile, isTouchCapable } from "./utils/detectors";
import { EventEmitter } from "./utils/events";


export interface InputDeviceEvent {
  deviceadded: { device: Device },
  deviceremoved: { device: Device },
}

export type Device = GamepadDevice | KeyboardDevice | CustomDevice;

export type NamedBindEvent<BindName extends string = string> = {
  device: Device;
  name: BindName;
}

class InputDeviceManager
{
  public static global = new InputDeviceManager();

  /** Whether we are a mobile device (including tablets) */
  public readonly isMobile: boolean = isMobile();

  /** Whether a touchscreen is available */
  public readonly isTouchCapable: boolean = isTouchCapable();

  /** Global keyboard input device */
  public readonly keyboard: KeyboardDevice;

  public options = {
    /**
     * Require window/document to be in foreground.
     */
    requireFocus: true,

    /**
     * When the window loses focus, this triggers the clear
     * input function.
     */
    clearInputInBackground: true,
  };

  private readonly _devices: Device[] = [];
  private readonly _gamepadDevices: GamepadDevice[] = [];
  private readonly _gamepadDeviceMap = new Map<number, GamepadDevice>();
  private readonly _customDevices: CustomDevice[] = [];
  private readonly _emitter = new EventEmitter<InputDeviceEvent>();
  private readonly _bindEmitter = new EventEmitter<Record<string, NamedBindEvent>>();

  private _hasFocus: boolean = false;
  private _lastInteractedDevice?: Device;

  private constructor()
  {
    // setup global keyboard
    // - on touchscreen/mobile devices, wait until a key is pressed
    // - otherwise assume keyboard exists and register immediately
    this.keyboard = KeyboardDevice.global;
    if ( !this.isTouchCapable && !this.isMobile ) this.add( this.keyboard ); // immediately register
    else window.addEventListener( "keydown", () => this.add( this.keyboard ), { once: true }); // defer until used

    // configure gamepads:
    window.addEventListener( "gamepadconnected", () => this._pollGamepads( performance.now() )); // register
    window.addEventListener( "gamepaddisconnected", ( e ) => this._removeGamepad( e.gamepad.index ));
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
  public onBind<N extends string>(
    name: N | readonly N[],
    listener: ( event: NamedBindEvent<N> ) => void
  ): this
  {
    name = Array.isArray( name ) ? name : [name];
    name.forEach( n => this._bindEmitter.on( n, listener ) );
    return this;
  }

  /** Remove a named bind event listener (or all if none provided). */
  public offBind(
    name: string | string[],
    listener?: ( event: NamedBindEvent ) => void
  ): this
  {
    name = Array.isArray( name ) ? name : [name];
    name.forEach( n => this._bindEmitter.off( n, listener ) );

    return this;
  }

  /** Report a named bind event (from a CustomDevice). */
  public emitBind( e: NamedBindEvent ): void
  {
    this._bindEmitter.emit( e.name, e );
  }

  // ----- Devices: -----

  /** Add a custom device. */
  public add( device: Device ): void
  {
    if ( this._devices.indexOf( device ) !== -1 )
    {
      return; // device already added!
    }

    this._devices.push( device );

    if ( device instanceof KeyboardDevice )
    {
      device.detected = true;

      // forward named bind events
      device.on( "bind", (e) => this.emitBind(e) );
    }
    else if ( device instanceof GamepadDevice )
    {
      this._gamepadDeviceMap.set( device.source.index, device );
      this._gamepadDevices.push( device );

      // forward named bind events
      device.on( "bind", (e) => this.emitBind(e) );
    }
    else
    {
      this._customDevices.push( device );
    }

    this._emitter.emit( "deviceadded", { device });
  }

  /** Remove a custom device. */
  public remove( device: Device ): void
  {
    if ( !( device instanceof KeyboardDevice || device instanceof GamepadDevice ) )
    {
      const customIndex = this._customDevices.indexOf( device );
      if ( customIndex !== -1 ) this._devices.splice( customIndex, 1 );
    }

    const devicesIndex = this._devices.indexOf( device );

    if ( devicesIndex !== -1 )
    {
      this._devices.splice( devicesIndex, 1 );

      this._emitter.emit( "deviceremoved", {
        device,
      });
    }
  }

  // ----- Update loop: -----

  /**
   * Performs a poll of latest input from all devices
   */
  public update(): ReadonlyArray<Device>
  {
    if ( this.options.requireFocus && ! document.hasFocus() )
    {
      // early exit: window not in focus

      if ( this._hasFocus && this.options.clearInputInBackground )
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
    if ( this._devices.length === 1 ) last = this._devices[0]!;
    else
    {
      for ( const device of this._devices )
      {
        if ( last === undefined ) last = device;
        else if ( device.lastInteraction > last.lastInteraction )
        {
          last = device;
        }
      }
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
