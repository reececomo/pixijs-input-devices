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

  /** Whether we are a mobile device (including tablets) */
  public readonly isMobile: boolean = isMobile();

  /** Whether a touchscreen is available */
  public readonly isTouchCapable: boolean = isTouchCapable();

  /** Global keyboard input device */
  public readonly keyboard: KeyboardDevice;

  public options = {
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
  private readonly _groupEmitter = new EventEmitter<Record<string, NamedGroupEvent>>();

  private _hasFocus = false;

  private constructor()
  {
    // setup global keyboard
    // - on touchscreen/mobile devices, wait until a key is pressed
    // - otherwise assume keyboard exists and register immediately
    this.keyboard = KeyboardDevice.global;
    if ( !this.isTouchCapable && !this.isMobile ) this.add( this.keyboard ); // immediately register
    else window.addEventListener( "keydown", () => this.add( this.keyboard ), { once: true }); // defer until used

    // configure gamepads:
    window.addEventListener( "gamepadconnected", () => this.pollGamepads( performance.now() )); // trigger register
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
    if ( this._devices.indexOf( device ) !== -1 )
    {
      return; // device already added!
    }

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
    if ( !document.hasFocus() )
    {
      // early exit: window not in focus

      if ( this._hasFocus && this.options.clearInputInBackground )
      {
        // clear input
        this.devices.forEach( device => device.clear?.() );
      }

      this._hasFocus = false;

      return this._devices;
    }

    this._hasFocus = true;

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
