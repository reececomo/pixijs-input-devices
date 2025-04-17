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
    Face1: 0,
    Face2: 1,
    Face3: 2,
    Face4: 3,
    LeftShoulder: 4,
    RightShoulder: 5,
    LeftTrigger: 6,
    RightTrigger: 7,
    Back: 8,
    Start: 9,
    LeftStickClick: 10,
    RightStickClick: 11,
    DpadUp: 12,
    DpadDown: 13,
    DpadLeft: 14,
    DpadRight: 15,
} as const;

export type Button = (typeof Button)[keyof typeof Button];

export const ButtonCode = [
    "Face1",
    "Face2",
    "Face3",
    "Face4",
    "LeftShoulder",
    "RightShoulder",
    "LeftTrigger",
    "RightTrigger",
    "Back",
    "Start",
    "LeftStickClick",
    "RightStickClick",
    "DpadUp",
    "DpadDown",
    "DpadLeft",
    "DpadRight",
] as const satisfies Record<Button, string>;
export type ButtonCode = typeof ButtonCode[number];

/** Array with strongly-typed indices (0-15) */
export type GamepadButtons = {
  [Button.Face1]: GamepadButton,
  [Button.Face2]: GamepadButton,
  [Button.Face3]: GamepadButton,
  [Button.Face4]: GamepadButton,
  [Button.LeftShoulder]: GamepadButton,
  [Button.RightShoulder]: GamepadButton,
  [Button.LeftTrigger]: GamepadButton,
  [Button.RightTrigger]: GamepadButton,
  [Button.Back]: GamepadButton,
  [Button.Start]: GamepadButton,
  [Button.LeftStickClick]: GamepadButton,
  [Button.RightStickClick]: GamepadButton,
  [Button.DpadUp]: GamepadButton,
  [Button.DpadDown]: GamepadButton,
  [Button.DpadLeft]: GamepadButton,
  [Button.DpadRight]: GamepadButton,
};
