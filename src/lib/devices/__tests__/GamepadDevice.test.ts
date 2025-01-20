import { Button, GamepadDevice } from "../gamepads/GamepadDevice";
import { Axis } from "../gamepads/buttons";
import { mockGamepadSource } from "./__fixtures__/gamepad";

describe( "GamepadDevice", () =>
{
  describe( "layout", () =>
  {
    it.each([
      [ "standard", "8Bitdo SF30 Pro (Vendor: 2dc8 Product: 6000)" ],
      [ "standard", "Generic Game Controller" ],
      [ "standard", "UNKNOWN" ],
      [ "standard", "USB JOYSTICK PS3 (Vendor: 1f4f Product: 0008)" ],
      [ "logitech", "046d-c216-Logitech Dual Action" ], // Firefox
      [ "logitech", "46d-c216-Logicool Dual Action" ], // Safari
      [ "logitech", "Input device (Vendor: 046D Product: C216)" ],
      [ "logitech", "Logitech Dual Action (STANDARD GAMEPAD Vendor: 046d Product: c216)" ],
      [ "logitech", "Logitech F310" ],
      [ "nintendo", "Nintendo Switch Pro" ],
      [ "nintendo", "Pro Controller (Vendor: 057e Product: 2009)" ],
      [ "playstation", "GENERIC INPUT (Vendor: 054c Product: 0ce6)" ],
      [ "playstation", "Playstation 5 DualSense Controller" ],
      [ "playstation", "Sony PLAYSTATION(R)3 Controller (STANDARD GAMEPAD Vendor: 054c Product: 0268)" ],
      [ "playstation", "Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 05c4)" ],
      [ "steam", "Input device (Vendor: 28de Product: 1142)" ],
      [ "steam", "Steam Deck Controller" ],
      [ "xbox", "GENERIC XINPUT DEVICE" ],
      [ "xbox", "Xbox 360 Controller (XInput STANDARD GAMEPAD)" ],
      [ "xbox", "Xbox SERIES X Controller" ],
    ])("%s is detected for %s", ( expected, input ) =>
    {
      const source = mockGamepadSource({
        id: input,
      });
      const gamepad = new GamepadDevice( source );

      expect( gamepad.layout ).toBe( expected );
    });
  });

  describe( "named binds", () =>
  {
    it("correctly maps named binds to their buttons", () =>
    {
      const source = mockGamepadSource();
      const gamepad = new GamepadDevice( source );

      gamepad.options.binds = {
        jump: [ "A", "B" ],
        crouch: [ "B", "X" ],
      };
      gamepad.update( source, Date.now() );

      expect( gamepad.pressedBind( "jump" ) ).toBe( false );
      expect( gamepad.pressedBind( "crouch" ) ).toBe( false );

      (source.buttons[Button.X] as any).pressed = true;
      gamepad.update( source, Date.now() );

      expect( gamepad.pressedBind( "jump" ) ).toBe( false );
      expect( gamepad.pressedBind( "crouch" ) ).toBe( true );

      (source.buttons[Button.X] as any).pressed = false;
      gamepad.update( source, Date.now() );

      expect( gamepad.pressedBind( "jump" ) ).toBe( false );
      expect( gamepad.pressedBind( "crouch" ) ).toBe( false );

      (source.buttons[Button.B] as any).pressed = true;
      gamepad.update( source, Date.now() );

      expect( gamepad.pressedBind( "jump" ) ).toBe( true );
      expect( gamepad.pressedBind( "crouch" ) ).toBe( true );

      (source.buttons[Button.B] as any).pressed = false;
      gamepad.update( source, Date.now() );

      expect( gamepad.pressedBind( "jump" ) ).toBe( false );
      expect( gamepad.pressedBind( "crouch" ) ).toBe( false );
    });
  });

  it( "maps axis, buttons and triggers", () =>
  {
    const source = mockGamepadSource();
    const gamepad = new GamepadDevice( source );

    (source.buttons[Button.A] as any).pressed = true;
    (source.buttons[Button.RightTrigger] as any).pressed = true;
    (source.buttons[Button.RightTrigger] as any).value = 0.67;
    (source.buttons[Button.RightStickClick] as any).pressed = true;
    (source.axes[Axis.LeftStickX] as any) = 0.55;
    (source.axes[Axis.RightStickY] as any) = -0.35;

    gamepad.update( source, Date.now() );

    // buttons
    expect( gamepad.button.A ).toBe( true );
    expect( gamepad.button.RightStickClick ).toBe( true );

    // joysticks
    expect( gamepad.leftJoystick.x ).toBe( 0.55 );
    expect( gamepad.leftJoystick.y ).toBe( 0.0 );
    expect( gamepad.button.LeftStickLeft ).toBe( false );
    expect( gamepad.button.LeftStickDown ).toBe( false );
    expect( gamepad.button.LeftStickUp ).toBe( false );
    expect( gamepad.button.LeftStickRight ).toBe( true );

    expect( gamepad.rightJoystick.x ).toBe( 0.0 );
    expect( gamepad.rightJoystick.y ).toBe( -0.35 );
    expect( gamepad.button.RightStickLeft ).toBe( false );
    expect( gamepad.button.RightStickDown ).toBe( false );
    expect( gamepad.button.RightStickUp ).toBe( true );
    expect( gamepad.button.RightStickRight ).toBe( false );

    // triggers
    expect( gamepad.leftTrigger ).toBe( 0.0 );
    expect( gamepad.button.LeftTrigger ).toBe( false );

    expect( gamepad.rightTrigger ).toBe( 0.67 );
    expect( gamepad.button.RightTrigger ).toBe( true );
  });

  describe( "nintendo layout remapping options", () =>
  {
    it( "remaps nintendo controllers to the expected layouts", () =>
    {
      const source = mockGamepadSource({
        id: "Nintendo Switch Pro"
      });
      const gamepad = new GamepadDevice( source );

      // sanity check:
      expect( gamepad.layout ).toBe( "nintendo" );

      gamepad.options.nintendoRemapMode = "none";
      (source.buttons[0] as any).pressed = true;
      (source.buttons[2] as any).pressed = true;
      gamepad.update( source, Date.now() );
      expect( gamepad.button.A ).toBe( true );
      expect( gamepad.button.B ).toBe( false );
      expect( gamepad.button.X ).toBe( true );
      expect( gamepad.button.Y ).toBe( false );

      gamepad.options.nintendoRemapMode = "accurate";
      gamepad.update( source, Date.now() );
      expect( gamepad.button.A ).toBe( true );
      expect( gamepad.button.B ).toBe( true ); // B (1) is now Nintendo "B"
      expect( gamepad.button.X ).toBe( false ); // X (2) is now Nintendo "X"
      expect( gamepad.button.Y ).toBe( false );

      gamepad.options.nintendoRemapMode = "physical";
      gamepad.update( source, Date.now() );
      expect( gamepad.button.A ).toBe( false ); // A (0) is now Nintendo "B"
      expect( gamepad.button.B ).toBe( true ); // B (1) is now Nintendo "A"
      expect( gamepad.button.X ).toBe( false ); // X (2) is now Nintendo "Y"
      expect( gamepad.button.Y ).toBe( true ); // Y (3) is now Nintendo "X"
    });
  });
});
