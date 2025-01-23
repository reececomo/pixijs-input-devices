/* eslint-disable brace-style */

import { Axis, AxisCode, Button, ButtonCode } from "./buttons";
import { detectLayout, GamepadLayout } from "./layouts";
import { EventEmitter, EventOptions } from "../../utils/events";


export { Button, GamepadLayout };

type NintendoRemapMode = "none" | "accurate" | "physical";

export type GamepadVibration = {
  // GamepadEffectParameters
  duration?: number;
  leftTrigger?: number;
  rightTrigger?: number;
  startDelay?: number;
  strongMagnitude?: number;
  weakMagnitude?: number;
} & {
  // GamepadHapticEffectType
  vibrationType?: "dual-rumble" | "trigger-rumble"
};

export type GamepadButtonDownEvent = ( gamepad: GamepadDevice, button: Button ) => void;

export interface GamepadButtonPressEvent {
  device: GamepadDevice;
  button: Button;
  buttonCode: ButtonCode;
}

export interface GamepadAxisEvent {
  device: GamepadDevice;
  axis: Axis;
  axisCode: AxisCode;
}

export type GamepadNamedBindEvent = {
  device: GamepadDevice;
  name: string;
  type: "button";
  button: Button;
  buttonCode: ButtonCode;
} | {
  device: GamepadDevice;
  name: string;
  type: "axis";
  axis: Axis;
  axisCode: AxisCode;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type GamepadDeviceEvent = {
  bind: GamepadNamedBindEvent;
} & {
  [axis in AxisCode]: GamepadAxisEvent;
} & {
  [button in ButtonCode]: GamepadButtonPressEvent;
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
   */
  public static configureDefaultBinds<BindName extends string>(
    binds: Partial<Record<BindName, GamepadCode[]>>
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
     * When set to `"physical"` _(default)_, ABXY refer to the equivalent
     * positions on a standard layout controller.
     *
     * When set to `"accurate"`, ABXY refer to the ABXY buttons on a Nintendo
     * controller.
     *
     * When set to `"none"`, ABXY refer to the unmapped buttons in the 0, 1,
     * 2, and 3 positions respectively.
     * @default "physical"
     */
    nintendoRemapMode: "physical" as NintendoRemapMode,

    /**
     * When enabled, all "navigate.*" binds will trigger a default haptic.
     * @default true
     */
    hapticNavigation: true,

    /**
     * Joystick configuration.
     */
    joystick: {
      /**
       * The range of movement in a joystick recognized as input, to
       * prevent unintended movements caused by imprecision or wear.
       *
       * @default [ 0, 1 ]
       */
      deadzone: [0.0, 1.0] satisfies [ min: number, max: number ],

      /**
       * The threshold joysticks must reach to emit navigation and bind events.
       *
       * @default 0.25
       */
      threshold: 0.25,

      /**
       * The amount of time (in milliseconds) between emitting axis events in a
       * given direction, given as [first, subsequent].
       *
       * @default [ delay: 400, repeat: 80 ]
       */
      autoRepeatDelayMs: [400, 80] satisfies [ delay: number, subsequent: number ],
    },

    /**
     * Trigger configuration.
     */
    trigger: {
      /**
       * The range of movement in a trigger recognized as input, to
       * revent unintended movements caused by imprecision or wear.
       *
       * @default [ 0, 1 ]
       */
      deadzone: [0.0, 1.0] satisfies [ min: number, max: number ],
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
       * Intensity of vibration, between 0.0 and 1.0.
       *
       * @default 1
       */
      intensity: 1.0,
    },

    /**
     * Create named binds of buttons.
     * This can be used with `pressedBind( name )`.
     */
    binds: {
      "navigate.trigger": [ "A" ],
      "navigate.back": [ "B" ],
      "navigate.up": [ "DPadUp", "LeftStickUp" ],
      "navigate.left": [ "DPadLeft", "LeftStickLeft" ],
      "navigate.down": [ "DPadDown", "LeftStickDown" ],
      "navigate.right": [ "DPadRight", "LeftStickRight" ],
    } as Partial<Record<string, GamepadCode[]>>,
  };

  /**
   * Globally unique identifier for this gamepad slot.
   * @example "gamepad0"
   */
  public readonly id: string;
  public readonly type = "gamepad";

  /** Whether this gamepad has vibration capabilties. */
  public readonly isVibrationCapable = ( "vibrationActuator" in this.source );

  /**
   * Associate custom meta data with a device.
   */
  public readonly meta: Record<string, any> = {};

  /**
   * When the gamepad was last interacted with.
   */
  public lastInteraction = performance.now();

  /**
   * Platform of this gamepad, useful for configuring standard
   * button layouts or displaying branded icons.
   * @example "playstation"
   */
  public layout: GamepadLayout;

  /**
   * Gamepad configuration options.
   */
  public options: typeof GamepadDevice.defaultOptions =
    JSON.parse( JSON.stringify( GamepadDevice.defaultOptions ) ); // clone

  // ----- Joysticks: -----

  public readonly leftJoystick = { x: 0, y: 0 };
  public readonly rightJoystick = { x: 0, y: 0 };

  // ----- Buttons: -----

  /** Accessors for buttons */
  public button: Record<AxisCode | ButtonCode, boolean> =
    [...ButtonCode, ...AxisCode ].reduce( (obj, key) =>
    {
      obj[key] = false;
      return obj;
    }, {} as any );

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

  private readonly _emitter = new EventEmitter<GamepadDeviceEvent>();
  private readonly _bindEmitter = new EventEmitter<Record<string, GamepadNamedBindEvent>>();
  private readonly _debounces = new Map<GamepadCode, number>();

  // ----- Button helpers: -----

  /** @returns true if any button from the named bind is pressed. */
  public pressedBind( name: string ): boolean
  {
    if ( this.options.binds[name] === undefined ) return false;
    return this.pressedAny( this.options.binds[name] );
  }

  /** @returns true if any of the given buttons are pressed. */
  public pressedAny( btns: GamepadCode[] ): boolean
  {
    for ( let i = 0; i < btns.length; i++ )
    {
      if ( this.button[btns[i]!] ) return true;
    }

    return false;
  }

  /** @returns true if all of the given buttons are pressed. */
  public pressedAll( btns: GamepadCode[] ): boolean
  {
    for ( let i = 0; i < btns.length; i++ )
    {
      if ( !this.button[btns[i]!] ) return false;
    }

    return true;
  }

  /** Set named binds for this gamepad */
  public configureBinds<BindName extends string>(
    binds: Partial<Record<BindName, GamepadCode[]>>
  ): void
  {
    this.options.binds = {
      ...this.options.binds,
      ...binds,
    };
  }

  // ----- Events: -----

  /** Add an event listener */
  public on<K extends keyof GamepadDeviceEvent>(
    event: K,
    listener: (event: GamepadDeviceEvent[K]) => void,
    options?: EventOptions,
  ): this
  {
    this._emitter.on( event, listener, options );
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
  public onBind(
    name: string,
    listener: ( event: GamepadNamedBindEvent ) => void,
    options?: EventOptions,
  ): this
  {
    this._bindEmitter.on( name, listener, options );
    return this;
  }

  /** Remove a named bind event listener (or all if none provided). */
  public offBind(
    name: string,
    listener?: ( event: GamepadNamedBindEvent ) => void
  ): this
  {
    this._bindEmitter.off( name, listener );
    return this;
  }

  // ----- Vibration: -----

  /**
   * Play a vibration effect (if supported).
   *
   * This API only works in browsers that support it.
   * @see https://caniuse.com/mdn-api_gamepad_vibrationactuator
   */
  public playVibration({
    duration = 200,
    weakMagnitude = 0.5,
    strongMagnitude = 0.5,
    // additional options:
    vibrationType = "dual-rumble",
    rightTrigger = 0,
    leftTrigger = 0,
    startDelay = 0,
  }: GamepadVibration = {}): void
  {
    if ( !this.isVibrationCapable ) return;
    if ( !this.options.vibration.enabled ) return;

    const intensity = this.options.vibration.intensity;

    try {
      ( this.source as any ).vibrationActuator.playEffect( vibrationType, {
        duration,
        startDelay,
        weakMagnitude: intensity * weakMagnitude,
        strongMagnitude: intensity * strongMagnitude,
        leftTrigger: intensity * leftTrigger,
        rightTrigger: intensity * rightTrigger,
      });
    }
    catch ( error )
    {
      console.warn( "gamepad vibration failed with error:", error );
    }
  }

  // ----- Lifecycle: -----

  public update( source: Gamepad, now: number ): void
  {
    this._updatePresses( source, now );
    this.source = source;
  }

  public clear(): void
  {
    this.button = [...AxisCode, ...ButtonCode].reduce( (obj, key) =>
    {
      obj[key] = false;
      return obj;
    }, {} as any );
  }

  public constructor( public source: Gamepad )
  {
    this.id = "gamepad" + source.index;
    this.layout = detectLayout( source );
  }

  private _updatePresses( source: Gamepad, now: number ): void
  {
    const axisCount = 4;
    const buttonCount = 16;
    const joy = this.options.joystick;

    // axis
    for ( let a = 0; a < axisCount; a++ )
    {
      const value = _scale( source.axes[a], joy.deadzone );
      const axisCode = AxisCode[a * 2 + ( value > 0 ? 1 : 0 )];

      if ( Math.abs( value ) < joy.threshold )
      {
        this.button[axisCode] = false;
      }
      else
      {
        const delayMs = joy.autoRepeatDelayMs[+this.button[axisCode]];

        if ( this._debounce( axisCode, delayMs ) && this.button[axisCode] )
        {
          continue;
        }

        this.button[axisCode] = true;
        this.lastInteraction = now;

        // emit events
        if ( this.options.emitEvents )
        {
          if ( this._emitter.hasListener( axisCode ) )
          {
            this._emitter.emit( axisCode, {
              device: this,
              axis: a as Axis,
              axisCode,
            });
          }

          // check named bind events
          Object.entries( this.options.binds ).forEach(([ name, values ]) =>
          {
            if ( !values.includes(axisCode) ) return;

            const event: GamepadNamedBindEvent = {
              device: this,
              type: "axis",
              axis: a as Axis,
              axisCode,
              name: name,
            };

            this._bindEmitter.emit( name, event );
            this._emitter.emit( "bind", event );
          });
        }
      }
    }

    // buttons
    for (let _b = 0; _b < buttonCount; _b++)
    {
      let b = _b as Button;

      // remap nintendo binds (if enabled)
      if (
        this.layout === "nintendo" &&
        this.options.nintendoRemapMode !== "none"
      )
      {
        if ( this.options.nintendoRemapMode === "physical" )
        {
          // physical:
          // set A,B,X,Y to be the equivalent physical positions
          if ( b === Button.B ) b = Button.A;
          else if ( b === Button.A ) b = Button.B;
          else if ( b === Button.X ) b = Button.Y;
          else if ( b === Button.Y ) b = Button.X;
        }
        else
        {
          // accurate:
          // set A,B,X,Y to match nintendo labels
          if ( b === Button.B ) b = Button.X;
          else if ( b === Button.X ) b = Button.B;
        }
      }

      const buttonCode = ButtonCode[b];

      if ( this.button[buttonCode] === source.buttons[_b]?.pressed )
      {
        continue; // skip: no change
      }

      this.lastInteraction = now;

      // update
      const isPressed = source.buttons[_b]?.pressed ?? false;
      this.button[buttonCode] = isPressed;

      if ( isPressed && this.options.emitEvents )
      {
        // emit events
        if ( this._emitter.hasListener( buttonCode ) )
        {
          this._emitter.emit( buttonCode, {
            device: this,
            button: b,
            buttonCode,
          });
        }

        // check named bind events
        Object.entries( this.options.binds ).forEach(([ name, buttons ]) =>
        {
          if ( !buttons.includes(buttonCode) ) return;

          const event: GamepadNamedBindEvent = {
            device: this,
            type: "button",
            button: b,
            buttonCode,
            name: name,
          };

          this._bindEmitter.emit( name, event );
          this._emitter.emit( "bind", event );
        });
      }
    }

    // triggers
    const tdz = this.options.trigger.deadzone;
    this.leftTrigger = _scale( source.buttons[Button.LeftTrigger].value, tdz );
    this.rightTrigger = _scale( source.buttons[Button.RightTrigger].value, tdz );
    this.leftShoulder = _scale( source.buttons[Button.LeftShoulder].value, tdz );
    this.rightShoulder = _scale( source.buttons[Button.RightShoulder].value, tdz );

    // joysticks
    const jdz = joy.deadzone;
    this.leftJoystick.x = _scale( source.axes[Axis.LeftStickX] ?? 0, jdz );
    this.leftJoystick.y = _scale( source.axes[Axis.LeftStickY] ?? 0, jdz);
    this.rightJoystick.x = _scale( source.axes[Axis.RightStickX] ?? 0, jdz );
    this.rightJoystick.y = _scale( source.axes[Axis.RightStickY] ?? 0, jdz );
  }

  /**
   * Inline relay debouncer.
   * @returns true when already in progress and the operation should be skipped
   */
  private _debounce( key: GamepadCode, delayMs: number ): boolean
  {
    const now = Date.now();

    if (
      ( this._debounces.get( key ) ?? 0 ) > now
    ) return true;

    this._debounces.set( key, now + delayMs );
    return false;
  }
}

function _scale( value: number, range: [ min: number, max: number ] ): number
{
  const scaled = (Math.abs(value) - range[0]) / (range[1] - range[0]);
  return scaled >= 0 && scaled <= 1
    ? Math.sign(value) * scaled
    : scaled > 1 ? Math.sign(value) * 1 : 0;
}
