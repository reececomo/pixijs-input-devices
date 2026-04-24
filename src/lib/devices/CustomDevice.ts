import { HapticEffect } from "./HapticEffect";
import { IDeviceMetadata } from "../config/DeviceMetadata";

/**
 * Shared structural interface implemented by KeyboardDevice, GamepadDevice,
 * and any CustomDevice. Prefer this over the `Device` union type when you
 * want genuinely type-safe iteration over `InputDevice.devices`.
 */
export interface InputDeviceLike<BindName extends string = string>
{
  /** Device type discriminant. */
  readonly type: string;

  /** Unique identifier for this device. */
  readonly id: string;

  /** Arbitrary metadata stored against this device. */
  readonly meta: IDeviceMetadata;

  /** Timestamp when input was last modified. */
  readonly lastInteraction: number;

  /** @returns true when any code mapped to the named bind is active. */
  bindDown(name: BindName): boolean;

  /**
   * @returns true if the named bind transitioned from up to down since the
   * last `update()` call (i.e. "just pressed this frame").
   * Not all device types support this — check before calling.
   */
  bindPressed?(name: BindName): boolean;

  /**
   * @returns true if the named bind transitioned from down to up since the
   * last `update()` call (i.e. "just released this frame").
   * Not all device types support this — check before calling.
   */
  bindReleased?(name: BindName): boolean;

  /** Play a vibration effect (if the device supports it). */
  playHaptic(...effects: HapticEffect[]): void;

  /** Triggered during the polling function. */
  update(now: number, ...args: any[]): void;

  /** (Optional) Clear input, e.g. when the window loses focus. */
  clear?(): void;
}

export interface CustomDevice extends InputDeviceLike
{
  /**
   * Device type.
   *
   * Set this to "custom".
   */
  readonly type: "custom";

  /**
   * Unique identifier for this device.
   */
  readonly id: string;

  /**
   * Arbitrary metadata stored against this device.
   */
  readonly meta: IDeviceMetadata;

  /**
    * Timestamp when input was last modified.
    *
    * Set this to `now` during update() if the device is interacted with,
    * and this will automatically become `InputDevice.lastInteractedDevice`.
    */
  readonly lastInteraction: number;

  /** Triggered during the polling function. */
  update(now: number): void;

  /** @returns true when a bind was activated in the previous update(). */
  bindDown(name: string): boolean

  /**
   * (Optional) @returns true if the named bind went down this frame.
   * Implement alongside `bindDown` to support edge-detection polling.
   */
  bindPressed?(name: string): boolean;

  /**
   * (Optional) @returns true if the named bind went up this frame.
   * Implement alongside `bindDown` to support edge-detection polling.
   */
  bindReleased?(name: string): boolean;

  /**
   * Play a vibration effect (if device supports it).
   */
  playHaptic(hapticEffect: HapticEffect): void;

  /**
   * (Optional) Clear input.
   *
   * This method is triggered when the window is moved to background.
   */
  clear?(): void;
}
