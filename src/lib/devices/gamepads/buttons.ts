export const Axis = {
  LeftStickX: 0,
  LeftStickY: 1,
  RightStickX: 2,
  RightStickY: 3,
} as const;

export const Button = {
  /** A Button (Xbox / Nintendo: "A", PlayStation: "Cross") */
  A: 0,
  /** B Button (Xbox: "B", PlayStation: "Circle", Nintendo: "X") */
  B: 1,
  /** X Button (Xbox: "X", PlayStation: "Square", Nintendo: "B") */
  X: 2,
  /** Y Button (Xbox / Nintendo: "Y", PlayStation: "Triangle") */
  Y: 3,
  /** Left Shoulder Button (Xbox: "LB", PlayStation: "L1", Nintendo: "L") */
  LeftShoulder: 4,
  /** Right Shoulder Button (Xbox: "RB", PlayStation: "R1", Nintendo: "R") */
  RightShoulder: 5,
  /** Left Trigger (Xbox: "LT", PlayStation: "L2", Nintendo: "ZL") */
  LeftTrigger: 6,
  /** Right Trigger (Xbox: "RT", PlayStation: "R2", Nintendo: "ZR") */
  RightTrigger: 7,
  /** Back Button (Xbox: "Back", PlayStation: "Share", Nintendo: "Minus") */
  Back: 8,
  /** Start Button (Xbox: "Start", PlayStation: "Options", Nintendo: "Plus") */
  Start: 9,
  /** Left Stick Press (Xbox / PlayStation: "LS", Nintendo: "L3") */
  LeftStick: 10,
  /** Right Stick Press (Xbox / PlayStation: "RS", Nintendo: "R3") */
  RightStick: 11,
  /** D-Pad Up */
  DPadUp: 12,
  /** D-Pad Down */
  DPadDown: 13,
  /** D-Pad Left */
  DPadLeft: 14,
  /** D-Pad Right */
  DPadRight: 15,
} as const;

export type Button = (typeof Button)[keyof typeof Button];

export const ButtonCode = [
  "A",
  "B",
  "X",
  "Y",
  "LeftShoulder",
  "RightShoulder",
  "LeftTrigger",
  "RightTrigger",
  "Back",
  "Start",
  "LeftStick",
  "RightStick",
  "DPadUp",
  "DPadDown",
  "DPadLeft",
  "DPadRight",
] as const satisfies Record<Button, string>;
export type ButtonCode = typeof ButtonCode[number];

/** Array with strongly-typed indices (0-15) */
export type GamepadButtons = {
  [Button.A]: GamepadButton,
  [Button.B]: GamepadButton,
  [Button.X]: GamepadButton,
  [Button.Y]: GamepadButton,
  [Button.LeftShoulder]: GamepadButton,
  [Button.RightShoulder]: GamepadButton,
  [Button.LeftTrigger]: GamepadButton,
  [Button.RightTrigger]: GamepadButton,
  [Button.Back]: GamepadButton,
  [Button.Start]: GamepadButton,
  [Button.LeftStick]: GamepadButton,
  [Button.RightStick]: GamepadButton,
  [Button.DPadUp]: GamepadButton,
  [Button.DPadDown]: GamepadButton,
  [Button.DPadLeft]: GamepadButton,
  [Button.DPadRight]: GamepadButton,
};
