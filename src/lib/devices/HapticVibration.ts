export type HapticEffect = {
  // GamepadEffectParameters:
  /** How long the vibration lasts (in milliseconds) */
  duration: number;
  /** Strength of the strong-magnitude, high-frequency motor (feels more like a "buzz") */
  buzz?: number;
  /** Strength of the weak-magnitude, low-frequency motor (feels more like a "rumble") */
  rumble?: number;
  /** Strength of the left trigger motor (if supported) */
  leftTrigger?: number;
  /** Strength of the right trigger motor (if supported) */
  rightTrigger?: number;
  /** Delay the start of the vibration effect (in milliseconds) */
  startDelay?: number;
};
