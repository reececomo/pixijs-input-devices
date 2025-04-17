export type HapticEffect = {
  // GamepadEffectParameters:
  /** How long the vibration lasts (in milliseconds) */
  duration: number;
  /** Strength of the high-frequency motor (feels more like a "buzz") */
  strongMagnitude?: number;
  /** Strength of the low-frequency motor (feels more like a "rumble") */
  weakMagnitude?: number;
  /** Strength of the left trigger motor (if supported) */
  leftTrigger?: number;
  /** Strength of the right trigger motor (if supported) */
  rightTrigger?: number;
  /** Delay the start of the vibration effect (in milliseconds) */
  startDelay?: number;
} & {
  // GamepadHapticEffectType
  vibrationType?: "dual-rumble" | "trigger-rumble"
};
