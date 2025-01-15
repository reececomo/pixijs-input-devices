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

class InputDeviceManager
{
  public static global = new InputDeviceManager();

  public readonly keyboard: KeyboardDevice;
  private readonly _emitter = new EventEmitter<InputDeviceEvent>();

  /** Whether we are a mobile device (including tablets) */
  public readonly isMobile: boolean = isMobile();

  /** Whether a touchscreen is available */
  public readonly isTouchCapable: boolean = isTouchCapable();

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

  private hasFocus = false;

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

  public options = {
    clearInputInBackground: true,
  };

  private _devices: Device[];
  private _gamepadDevices: GamepadDevice[] = [];
  private _gamepadDeviceMap = new Map<number, GamepadDevice>();

  private constructor()
  {
    // setup initial devices:
    this._devices = [];

    // configure global keyboard:
    const registerKeyboard = (): void =>
    {
      window.removeEventListener( "keydown", registerKeyboard );
      this._devices.push( this.keyboard );
      this._emitter.emit( "deviceadded", { device: this.keyboard });
      this.keyboard.detected = true;
    };
    this.keyboard = KeyboardDevice.global;

    if ( !this.isTouchCapable && !this.isMobile ) registerKeyboard(); // immediately register
    else window.addEventListener( "keydown", registerKeyboard ); // defer availability

    // configure gamepads:
    window.addEventListener( "gamepadconnected", () => this.pollGamepads( performance.now() )); // trigger register
    window.addEventListener( "gamepaddisconnected", ( e ) => this.removeGamepad( e.gamepad.index ));
  }

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

    // keyboard doesn't need it
    this.keyboard.lastUpdated = now;

    this.pollGamepads( now );

    return this._devices;
  }

  /** Add a custom device. */
  public add( device: CustomDevice ): void
  {
    this._devices.push( device );
  }

  /** Remove a custom device. */
  public remove( device: Device ): void
  {
    const devicesIndex = this._devices.indexOf( device );

    if ( devicesIndex !== -1 )
    {
      this._devices.splice( devicesIndex, 1 );

      this._emitter.emit( "deviceremoved", {
        device,
      });
    }
  }

  /**
   * @returns updates connected gamepads, performing a poll of latest input
   */
  public pollGamepads( now: number ): ReadonlyArray<GamepadDevice>
  {
    if ( !document.hasFocus() ) return this._gamepadDevices;
    if ( navigator.getGamepads === undefined ) return this._gamepadDevices;

    for ( const raw of navigator.getGamepads() )
    {
      if ( raw == null )
      {
        continue;
      }

      if ( this._gamepadDeviceMap.has( raw.index ) )
      {
        const gamepad = this._gamepadDeviceMap.get( raw.index );
        gamepad.update( raw, now );
      }
      else
      {
        const gamepad = new GamepadDevice( raw );
        this._gamepadDeviceMap.set( raw.index, gamepad );
        this._gamepadDevices.push( gamepad );
        this._devices.push( gamepad );

        this._emitter.emit( "deviceadded", {
          device: gamepad,
        });
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
