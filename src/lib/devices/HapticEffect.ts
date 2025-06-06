export interface HapticEffect
{
  /** How long the vibration lasts (in milliseconds) */
  duration: number;
  /** Strength of the low-frequency strong-magnitude motor (a deeper, heavier rumble) */
  rumble?: number;
  /** Strength of the high-frequency weak-magnitude motor (a lighter, buzzier vibration) */
  buzz?: number;
  /** Strength of the left trigger motor (on supported devices) */
  leftTrigger?: number;
  /** Strength of the right trigger motor (on supported devices) */
  rightTrigger?: number;
  /** Delay the start of the vibration effect (in milliseconds) */
  startDelay?: number;
}
