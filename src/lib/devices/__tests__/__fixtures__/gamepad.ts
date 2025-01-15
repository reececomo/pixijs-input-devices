export function mockGamepadSource(
  overrides: Partial<Gamepad> = {},
): Gamepad
{
  const instance = {
    index: 0,
    id: "mock-xinput",
    mapping: "standard",
    connected: true,
    axes: [ 0, 0, 0, 0 ],
    buttons: [
      mockButton(), mockButton(), mockButton(), mockButton(),
      mockButton(), mockButton(), mockButton(), mockButton(),
      mockButton(), mockButton(), mockButton(), mockButton(),
      mockButton(), mockButton(), mockButton(), mockButton(),
    ],
    timestamp: Date.now(),
    vibrationActuator: undefined as any,
    ...overrides,
  };

  return instance as Gamepad;

  // return new Gamepad();
}

function mockButton(): GamepadButton
{
  const instance = {
    pressed: false,
    touched: false,
    value: 0.0,
  };

  return instance as GamepadButton;

  // return new GamepadButton();
}