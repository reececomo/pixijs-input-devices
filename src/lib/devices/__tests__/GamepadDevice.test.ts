import { Button, GamepadDevice } from "../gamepads/GamepadDevice";
import { Axis } from "../gamepads/buttons";
import { mockGamepadSource } from "./__fixtures__/gamepad";

describe("GamepadDevice", () =>
{
    describe("layout", () =>
    {
        it.each([
            [ "unknown", "8Bitdo SF30 Pro (Vendor: 2dc8 Product: 6000)" ],
            [ "unknown", "Generic Game Controller" ],
            [ "unknown", "UNKNOWN" ],
            [ "unknown", "USB JOYSTICK PS3 (Vendor: 1f4f Product: 0008)" ],
            [ "logitech_g", "046d-c216-Logitech Dual Action" ], // Firefox
            [ "logitech_g", "46d-c216-Logicool Dual Action" ], // Safari
            [ "logitech_g", "Input device (Vendor: 046D Product: C216)" ],
            [ "logitech_g", "Logitech Dual Action (STANDARD GAMEPAD Vendor: 046d Product: c216)" ],
            [ "logitech_g", "Logitech F310" ],
            [ "nintendo_switch_pro", "Nintendo Switch Pro" ],
            [ "nintendo_switch_pro", "Pro Controller (Vendor: 057e Product: 2009)" ],
            [ "nintendo_joycon_l", "Nintendo Joy-Con (L)" ],
            [ "nintendo_joycon_l", "Nintendo JoyCon (l)" ],
            [ "nintendo_joycon_l", "Unknown (Vendor: 057e Product: 2006)" ],
            [ "nintendo_joycon_r", "Nintendo Joy-Con (R)" ],
            [ "nintendo_joycon_r", "Nintendo JoyCon (r)" ],
            [ "nintendo_joycon_r", "Unknown (Vendor: 057e Product: 2007)" ],
            [ "playstation_5", "GENERIC INPUT (Vendor: 054c Product: 0ce6)" ],
            [ "playstation_5", "Playstation 5 DualSense Controller" ],
            [ "playstation_5", "Sony PLAYSTATION(R)3 Controller (STANDARD GAMEPAD Vendor: 054c Product: 0268)" ],
            [ "playstation_5", "Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 05c4)" ],
            [ "steam_controller", "Input device (Vendor: 28de Product: 1142)" ],
            [ "steam_controller", "Steam Deck Controller" ],
            [ "xbox_360", "Xbox 360 Controller (XInput STANDARD GAMEPAD)" ],
            [ "xbox_360", "Unknown (Vendor: 045e Product: 0202)" ],
            [ "xbox_series", "Xbox SERIES X Controller" ],
            [ "xbox_series", "Unknown (Vendor: 045e Product: 0b00)" ],
            [ "xbox_one", "GENERIC XINPUT DEVICE" ],
            [ "xbox_one", "Unknown (Vendor: 045e Product: 02e3)" ],
        ])("%s is detected for %s", (expected, input) =>
        {
            const source = mockGamepadSource({
                id: input,
            });
            const gamepad = new GamepadDevice(source);

            expect(gamepad.layout).toBe(expected);
        });
    });

    describe("named binds", () =>
    {
        it("correctly maps named binds to their buttons", () =>
        {
            const source = mockGamepadSource();
            const gamepad = new GamepadDevice(source);

            gamepad.options.binds = {
                jump: [ "Face1", "Face2" ],
                crouch: [ "Face2", "Face3" ],
            };
            gamepad.update(source, Date.now());

            expect(gamepad.bindDown("jump")).toBe(false);
            expect(gamepad.bindDown("crouch")).toBe(false);

            (source.buttons[Button.Face3] as any).pressed = true;
            gamepad.update(source, Date.now());

            expect(gamepad.bindDown("jump")).toBe(false);
            expect(gamepad.bindDown("crouch")).toBe(true);

            (source.buttons[Button.Face3] as any).pressed = false;
            gamepad.update(source, Date.now());

            expect(gamepad.bindDown("jump")).toBe(false);
            expect(gamepad.bindDown("crouch")).toBe(false);

            (source.buttons[Button.Face2] as any).pressed = true;
            gamepad.update(source, Date.now());

            expect(gamepad.bindDown("jump")).toBe(true);
            expect(gamepad.bindDown("crouch")).toBe(true);

            (source.buttons[Button.Face2] as any).pressed = false;
            gamepad.update(source, Date.now());

            expect(gamepad.bindDown("jump")).toBe(false);
            expect(gamepad.bindDown("crouch")).toBe(false);
        });
    });

    it("maps axis, buttons and triggers", () =>
    {
        const source = mockGamepadSource();
        const gamepad = new GamepadDevice(source);

        (source.buttons[Button.Face1] as any).pressed = true;
        (source.buttons[Button.RightTrigger] as any).pressed = true;
        (source.buttons[Button.RightTrigger] as any).value = 0.67;
        (source.buttons[Button.RightStickClick] as any).pressed = true;
        (source.axes[Axis.LeftStickX] as any) = 0.55;
        (source.axes[Axis.RightStickY] as any) = -0.35;

        gamepad.update(source, Date.now());

        // buttons
        expect(gamepad.button.Face1).toBe(true);
        expect(gamepad.button.RightStickClick).toBe(true);

        // joysticks
        expect(gamepad.leftJoystick.x).toBe(0.55);
        expect(gamepad.leftJoystick.y).toBe(0.0);
        expect(gamepad.button.LeftStickLeft).toBe(false);
        expect(gamepad.button.LeftStickDown).toBe(false);
        expect(gamepad.button.LeftStickUp).toBe(false);
        expect(gamepad.button.LeftStickRight).toBe(true);

        expect(gamepad.rightJoystick.x).toBe(0.0);
        expect(gamepad.rightJoystick.y).toBe(-0.35);
        expect(gamepad.button.RightStickLeft).toBe(false);
        expect(gamepad.button.RightStickDown).toBe(false);
        expect(gamepad.button.RightStickUp).toBe(true);
        expect(gamepad.button.RightStickRight).toBe(false);

        // triggers
        expect(gamepad.leftTrigger).toBe(0.0);
        expect(gamepad.button.LeftTrigger).toBe(false);

        expect(gamepad.rightTrigger).toBe(0.67);
        expect(gamepad.button.RightTrigger).toBe(true);
    });

});
