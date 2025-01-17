/* eslint-disable brace-style */

import { Axis, Button, ButtonCode } from "./gamepads/buttons";
import { detectLayout, GamepadLayout } from "./gamepads/layouts";
import { Navigation } from "../navigation/Navigation";
import { NavigationIntent } from "../navigation/NavigationIntent";
import { throttle } from "../utils/throttle";
import { EventEmitter } from "../utils/events";


export { Button, GamepadLayout as GamepadPlatform };

type RemapNintendoMode = "none" | "accurate" | "physical";

export type GamepadVibration = GamepadEffectParameters & { vibrationType?: GamepadHapticEffectType };
export type GamepadButtonDownEvent = ( gamepad: GamepadDevice, button: Button ) => void;

export interface GamepadButtonPressEvent {
  device: GamepadDevice;
  button: Button;
  buttonCode: ButtonCode;
}

export interface GamepadNamedGroupButtonPressEvent extends GamepadButtonPressEvent {
  groupName: string;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type GamepadDeviceEvent = {
  group: GamepadNamedGroupButtonPressEvent;
} & {
  [button in ButtonCode]: GamepadButtonPressEvent;
} & {
  [button in Button]: GamepadButtonPressEvent;
};

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
  public static defaultOptions = {
    /**
     * When set to `"physical"` _(default)_, ABXY refer to the equivalent
     * positions on a standard layout controller.
     *
     * When set to `"accurate"`, ABXY refer to the ABXY buttons on a Nintendo
     * controller.
     *
     * When set to `"none"`, ABXY refer to the unmapped buttons in the 0, 1,
     * 2, and 3 positions respectively.
     */
    remapNintendoMode: "physical" as RemapNintendoMode,

    /**
     * Create named groups of buttons.
     *
     * This can be used with `groupPressed( name )`.
     *
     * @example
     * // set by names
     * Gamepad.defaultOptions.namedGroups = {
     *   jump: [ "A" ],
     *   crouch: [ "X" ],
     * }
     *
     * // check by named presses
     * if ( gamepad.groupPressed( "jump" ) )
     * {
     *   // ...
     * }
     */
    namedGroups: {
    } as Partial<Record<string, ButtonCode[]>>,

    navigation: {
      enabled: true,
      binds: {
        [ Button.A ]: "trigger",
        [ Button.B ]: "navigateBack",
        [ Button.Back ]: "navigateBack",
        [ Button.DPadDown ]: "navigateDown",
        [ Button.DPadLeft ]: "navigateLeft",
        [ Button.DPadRight ]: "navigateRight",
        [ Button.DPadUp ]: "navigateUp",
      } as Partial<Record<Button, NavigationIntent>>,
    },

    /**
     * The range of movement in a joystick recognized as input, to
     * prevent unintended movements caused by imprecision or wear.
     *
     * @default [ 0, 1 ]
     */
    joystickDeadzone: [0.0, 1.0] satisfies [ min: number, max: number ],

    /**
     * The range of movement in a trigger recognized as input, to
     * revent unintended movements caused by imprecision or wear.
     *
     * @default [ 0, 1 ]
     */
    triggerDeadzone: [0.0, 1.0] satisfies [ min: number, max: number ],

    intent: {
      joystickCommitSensitivity: 0.5,
      firstCooldownMs: 400,
      defaultCooldownMs: 80,
    },

    vibration: {
      enabled: true,
      intensity: 1.0,
    },
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
  public readonly meta: Record<string, any> = {};

  /** When the gamepad was last interacted with. */
  public lastInteraction = performance.now();

  /**
   * Platform of this gamepad, useful for configuring standard
   * button layouts or displaying branded icons.
   * @example "playstation"
   */
  public layout: GamepadLayout;

  public options: typeof GamepadDevice.defaultOptions =
    JSON.parse( JSON.stringify( GamepadDevice.defaultOptions ) ); // clone

  // ----- Joysticks: -----

  public readonly leftJoystick = {
    x: 0.0,
    y: 0.0,
  };
  public readonly rightJoystick = {
    x: 0.0,
    y: 0.0,
  };

  // ----- Buttons: -----

  /** Accessors for buttons */
  public button: Record<ButtonCode, boolean> =
    Object.keys(Button).reduce( (obj, key) =>
    {
      obj[key] = false;
      return obj;
    }, {} as any );

  // ----- Internal: -----

  private _btnPrevState = new Array<boolean>(16);
  private _axisIntents = new Array<boolean>(2);
  private readonly _throttleIdLeftStickX: string;
  private readonly _throttleIdLeftStickY: string;
  private readonly _emitter = new EventEmitter<GamepadDeviceEvent>();
  private readonly _groupEmitter = new EventEmitter<Record<string, GamepadNamedGroupButtonPressEvent>>();

  // ----- Triggers: -----

  /** A scalar 0.0 to 1.0 representing the left trigger value */
  public leftTrigger = 0;
  /** A scalar 0.0 to 1.0 representing the right trigger value */
  public rightTrigger = 0;
  /** A scalar 0.0 to 1.0 representing the left shoulder value */
  public leftShoulder = 0;
  /** A scalar 0.0 to 1.0 representing the right shoulder value */
  public rightShoulder = 0;

  // ----- Button helpers: -----

  /** @returns true if any button from the named group is pressed. */
  public groupPressed( name: string ): boolean
  {
    if ( this.options.namedGroups[name] === undefined ) return false;
    return this.anyPressed( this.options.namedGroups[name] );
  }

  /** @returns true if any of the given buttons are pressed. */
  public anyPressed( btns: ButtonCode[] ): boolean
  {
    for ( let i = 0; i < btns.length; i++ )
    {
      if ( this.button[btns[i]!] ) return true;
    }

    return false;
  }

  /** @returns true if all of the given buttons are pressed. */
  public allPressed( btns: ButtonCode[] ): boolean
  {
    for ( let i = 0; i < btns.length; i++ )
    {
      if ( !this.button[btns[i]!] ) return false;
    }

    return true;
  }

  // ----- Events: -----

  /** Add an event listener */
  public on<K extends keyof GamepadDeviceEvent>(
    event: K,
    listener: (event: GamepadDeviceEvent[K]) => void
  ): this
  {
    const e = typeof event === "number" ? ButtonCode[event] : event;
    this._emitter.on(e, listener);
    return this;
  }

  /** Remove an event listener (or all if none provided). */
  public off<K extends keyof GamepadDeviceEvent>(
    event: K,
    listener?: (event: GamepadDeviceEvent[K]) => void
  ): this
  {
    const e = typeof event === "number" ? ButtonCode[event] : event;
    this._emitter.off(e, listener);
    return this;
  }

  /** Add a named group event listener (or all if none provided). */
  public onGroup(
    name: string,
    listener: ( event: GamepadNamedGroupButtonPressEvent ) => void
  ): this
  {
    this._groupEmitter.on( name, listener );
    return this;
  }

  /** Remove a named group event listener (or all if none provided). */
  public offGroup(
    name: string,
    listener?: ( event: GamepadNamedGroupButtonPressEvent ) => void
  ): this
  {
    this._groupEmitter.off( name, listener );
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
    if ( !this.options.vibration.enabled ) return;
    if ( !this.source.vibrationActuator ) return;

    const intensity = this.options.vibration.intensity;

    try {
      this.source.vibrationActuator.playEffect( vibrationType, {
        duration,
        startDelay,
        weakMagnitude: intensity * weakMagnitude,
        strongMagnitude: intensity * strongMagnitude,
        leftTrigger: intensity * leftTrigger,
        rightTrigger: intensity * rightTrigger,
      });
    }
    catch
    {
      // fail silently
    }
  }

  // ----- Lifecycle: -----

  public update( source: Gamepad, now: number ): void
  {
    this.updatePresses( source, now );
    this.source = source;
  }

  public clear(): void
  {
    this._axisIntents = this._axisIntents.map(() => false);
    this._btnPrevState = this._btnPrevState.map(() => false);
  }

  public constructor( public source: Gamepad )
  {
    this.id = "gamepad" + source.index;
    this.layout = detectLayout( source );

    // cooldown ids:
    this._throttleIdLeftStickX = this.id + "-lsx";
    this._throttleIdLeftStickY = this.id + "-lsy";
  }

  private updatePresses( source: Gamepad, now: number ): void
  {
    const buttonCount = this._btnPrevState.length;

    // buttons
    for (let _b = 0; _b < buttonCount; _b++)
    {
      let b = _b as Button;

      // remap nintendo binds (if enabled)
      if (
        this.layout === "nintendo" &&
        this.options.remapNintendoMode !== "none"
      )
      {
        if ( this.options.remapNintendoMode === "physical" )
        {
          // set A,B,X,Y to be the equivalent physical positions
          if ( b === Button.B ) b = Button.A;
          else if ( b === Button.A ) b = Button.B;
          else if ( b === Button.X ) b = Button.Y;
          else if ( b === Button.Y ) b = Button.X;
        }
        else
        {
          // set A,B,X,Y to match nintendo labels
          if ( b === Button.B ) b = Button.X;
          else if ( b === Button.X ) b = Button.B;
        }
      }

      if ( this._btnPrevState[b] === source.buttons[_b]?.pressed )
      {
        continue; // skip: no change
      }

      this.lastInteraction = now;

      // update
      const isPressed = source.buttons[_b]?.pressed ?? false;
      const buttonCode = ButtonCode[b];

      this._btnPrevState[b] = isPressed;
      this.button[buttonCode] = isPressed;

      if ( isPressed )
      {
        // emit events
        if ( this._emitter.hasListener( buttonCode ) )
        {
          setTimeout( () => this._emitter.emit( buttonCode, {
            device: this,
            button: b,
            buttonCode,
          }) );
        }

        // navigation
        if (
          Navigation.options.enabled &&
          this.options.navigation.enabled &&
          this.options.navigation.binds[b] !== undefined
        )
        {
          setTimeout( () =>
            Navigation.commit( this.options.navigation.binds[b], this )
          );
        }

        // check named group events
        Object.entries( this.options.namedGroups ).forEach(([ name, buttons ]) =>
        {
          if ( !buttons.includes(buttonCode) ) return;

          setTimeout( () => {
            const event = {
              device: this,
              button: b,
              buttonCode,
              groupName: name,
            };

            this._groupEmitter.emit( name, event );
            this._emitter.emit( "group", event );
          });
        });
      }
    }

    // triggers
    const tdz = this.options.triggerDeadzone;
    this.leftTrigger = _scale( this.source.buttons[Button.LeftTrigger].value, tdz );
    this.rightTrigger = _scale( this.source.buttons[Button.RightTrigger].value, tdz );
    this.leftShoulder = _scale( this.source.buttons[Button.LeftShoulder].value, tdz );
    this.rightShoulder = _scale( this.source.buttons[Button.RightShoulder].value, tdz );

    // joysticks
    const jdz = this.options.joystickDeadzone;
    this.leftJoystick.x = _scale( source.axes[Axis.LeftStickX] ?? 0, jdz );
    this.leftJoystick.y = _scale( source.axes[Axis.LeftStickY] ?? 0, jdz);
    this.rightJoystick.x = _scale( source.axes[Axis.RightStickX] ?? 0, jdz );
    this.rightJoystick.y = _scale( source.axes[Axis.RightStickY] ?? 0, jdz );

    if (
      this.leftJoystick.x !== 0
      || this.leftJoystick.y !== 0
      || this.rightJoystick.x !== 0
      || this.rightJoystick.y !== 0
    ) this.lastInteraction = now;

    // left joystick navigation: left/right
    if ( Math.abs( this.leftJoystick.x ) >= this.options.intent.joystickCommitSensitivity )
    {
      const xIntent: NavigationIntent = this.leftJoystick.x < 0 ? "navigateLeft" : "navigateRight";

      // if we sent an intent too recently, this will slow us down.
      const cooldownDuration = this._axisIntents[ Axis.LeftStickX ]
        ? this.options.intent.defaultCooldownMs
        : this.options.intent.firstCooldownMs;

      this._axisIntents[ Axis.LeftStickX ] = true;

      if (
        this.options.navigation.enabled &&
        !throttle( this._throttleIdLeftStickX, cooldownDuration )
      )
      {
        setTimeout( () => Navigation.commit( xIntent, this ) );
      }
    }
    else
    {
      this._axisIntents[ Axis.LeftStickX ] = false;
    }

    // left joystick navigation: up/down
    if ( Math.abs( this.leftJoystick.y ) >= this.options.intent.joystickCommitSensitivity )
    {
      const yIntent: NavigationIntent = this.leftJoystick.y < 0 ? "navigateUp" : "navigateDown";

      // if we sent an intent too recently, this will slow us down.
      const cooldownDuration = this._axisIntents[ Axis.LeftStickY ]
        ? this.options.intent.defaultCooldownMs
        : this.options.intent.firstCooldownMs;

      this._axisIntents[ Axis.LeftStickY ] = true;

      if (
        this.options.navigation.enabled &&
        !throttle( this._throttleIdLeftStickY, cooldownDuration )
      )
      {
        setTimeout( () => Navigation.commit( yIntent, this ) );
      }
    }
    else
    {
      this._axisIntents[ Axis.LeftStickY ] = false;
    }
  }
}

function _scale( value: number, range: [ min: number, max: number ] ): number
{
  const scaled = (Math.abs(value) - range[0]) / (range[1] - range[0]);
  return scaled >= 0 && scaled <= 1
    ? Math.sign(value) * scaled
    : scaled > 1 ? Math.sign(value) * 1 : 0;
}
