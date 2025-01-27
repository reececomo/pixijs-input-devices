export const Axis = {
  LeftStickX: 0,
  LeftStickY: 1,
  RightStickX: 2,
  RightStickY: 3,
} as const;
export type Axis = (typeof Axis)[keyof typeof Axis];

export const AxisCode = [
  "LeftStickLeft",
  "LeftStickRight",
  "LeftStickUp",
  "LeftStickDown",
  "RightStickLeft",
  "RightStickRight",
  "RightStickUp",
  "RightStickDown",
] as const;
export type AxisCode = typeof AxisCode[number];

export const Button = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LeftShoulder: 4,
  RightShoulder: 5,
  LeftTrigger: 6,
  RightTrigger: 7,
  Back: 8,
  Start: 9,
  LeftStickClick: 10,
  RightStickClick: 11,
  DPadUp: 12,
  DPadDown: 13,
  DPadLeft: 14,
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
  "LeftStickClick",
  "RightStickClick",
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
  [Button.LeftStickClick]: GamepadButton,
  [Button.RightStickClick]: GamepadButton,
  [Button.DPadUp]: GamepadButton,
  [Button.DPadDown]: GamepadButton,
  [Button.DPadLeft]: GamepadButton,
  [Button.DPadRight]: GamepadButton,
};
