export interface CustomDevice
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
  readonly meta: Record<string, any>;

  /**
   * Timestamp when input was last modified.
   *
   * Set this to `now` during update() if the device is interacted with,
   * and this will automatically become `InputDevice.lastInteractedDevice`.
   */
  readonly lastInteraction: number;

  /** Triggered during the polling function. */
  update( now: number ): void;

  /** @returns true when a bind was activated in the previous update(). */
  pressedBind( name: string ): boolean

  /**
   * (Optional) Clear input.
   *
   * This method is triggered when the window is moved to background.
   */
  clear?(): void;
}
