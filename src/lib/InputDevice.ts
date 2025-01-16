import { CustomDevice } from "./devices/CustomDevice";
import { GamepadDevice } from "./devices/GamepadDevice";
import { KeyboardDevice } from "./devices/KeyboardDevice";
import { isMobile, isTouchCapable } from "./utils/detectors";
import { EventEmitter } from "./utils/events";


export interface InputDeviceEvent {
  deviceadded: { device: Device },
  deviceremoved: { device: Device },
}

export type Device = GamepadDevice | KeyboardDevice | CustomDevice;

type NamedGroupEvent = {
  device: Device;
  groupName: string;
}

class InputDeviceManager
{
  public static global = new InputDeviceManager();

  public readonly keyboard: KeyboardDevice;
  private readonly _emitter = new EventEmitter<InputDeviceEvent>();

  /** Whether we are a mobile device (including tablets) */
  public readonly isMobile: boolean = isMobile();

  /** Whether a touchscreen is available */
  public readonly isTouchCapable: boolean = isTouchCapable();

  private hasFocus = false;

  public options = {
    clearInputInBackground: true,
  };

  private readonly _devices: Device[];
  private readonly _gamepadDevices: GamepadDevice[] = [];
  private readonly _gamepadDeviceMap = new Map<number, GamepadDevice>();
  private readonly _customDevices: CustomDevice[] = [];
  private readonly _groupEmitter = new EventEmitter<Record<string, NamedGroupEvent>>();

  private constructor()
  {
    // setup initial devices:
    this._devices = [];

    // configure global keyboard:
    const registerKeyboard = (): void =>
    {
      this.add( this.keyboard );
    };

    this.keyboard = KeyboardDevice.global;

    if ( !this.isTouchCapable && !this.isMobile ) registerKeyboard(); // immediately register
    else window.addEventListener( "keydown", registerKeyboard, { once: true }); // defer availability

    // configure gamepads:
    window.addEventListener( "gamepadconnected", () => this.pollGamepads( performance.now() )); // trigger register
    window.addEventListener( "gamepaddisconnected", ( e ) => this.removeGamepad( e.gamepad.index ));
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
   * Connected devices.
   *
   * Keep in mind these inputs may only be up-to-date from the last update().
   */
  public get devices(): readonly Device[]
  {
    return this._devices;
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

  /** Add a named group event listener (or all if none provided). */
  public onGroup(
    name: string,
    listener: ( event: NamedGroupEvent ) => void
  ): this
  {
    this._groupEmitter.on( name, listener );
    return this;
  }

  /** Remove a named group event listener (or all if none provided). */
  public offGroup(
    name: string,
    listener?: ( event: NamedGroupEvent ) => void
  ): this
  {
    this._groupEmitter.off( name, listener );
    return this;
  }

  // ----- Devices: -----

  /** Add a custom device. */
  public add( device: Device ): void
  {
    this._devices.push( device );

    if ( device instanceof KeyboardDevice )
    {
      device.detected = true;

      // forward group events
      device.on( "group", (e) => this._groupEmitter.emit( e.groupName, e ) );
    }
    else if ( device instanceof GamepadDevice )
    {
      this._gamepadDeviceMap.set( device.source.index, device );
      this._gamepadDevices.push( device );

      // forward group events
      device.on( "group", (e) => this._groupEmitter.emit( e.groupName, e ) );
    }
    else if ( device instanceof CustomDevice )
    {
      this._customDevices.push( device );
    }

    this._emitter.emit( "deviceadded", { device });
  }

  /** Remove a custom device. */
  public remove( device: Device ): void
  {
    if ( device instanceof CustomDevice )
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
    if ( !document.hasFocus() )
    {
      // early exit: window not in focus

      if ( this.hasFocus && this.options.clearInputInBackground )
      {
        // clear input
        this.devices.forEach( device => device.clear() );
      }

      this.hasFocus = false;

      return this._devices;
    }

    this.hasFocus = true;

    const now = performance.now();

    this.keyboard.update( now );
    this.pollGamepads( now );

    if ( this._customDevices.length > 0 )
    {
      this._customDevices.forEach( custom => custom.update( now ) );
    }

    return this._devices;
  }

  /**
   * @returns updates connected gamepads, performing a poll of latest input
   */
  public pollGamepads( now: number ): ReadonlyArray<GamepadDevice>
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

  private removeGamepad( gamepadIndex: number ): void
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
