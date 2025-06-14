import { KeyboardDevice } from "../keyboard/KeyboardDevice";

describe("KeyboardDevice", () =>
{
    describe("named binds", () =>
    {
        it("correctly maps named binds to their buttons", () =>
        {
            const now = Date.now();
            const keyboard = KeyboardDevice.global;

            keyboard.configureBinds({
                jump: [ "Space", "ControlLeft" ],
                crouch: [ "ControlLeft", "ShiftLeft" ],
            });

            expect(keyboard.bindDown("jump")).toBe(false);
            expect(keyboard.bindDown("crouch")).toBe(false);

            mockKeydown("ShiftLeft");
            keyboard.update(now);

            expect(keyboard.bindDown("jump")).toBe(false);
            expect(keyboard.bindDown("crouch")).toBe(true);

            mockKeyup("ShiftLeft");
            keyboard.update(now);

            expect(keyboard.bindDown("jump")).toBe(false);
            expect(keyboard.bindDown("crouch")).toBe(false);

            mockKeydown("ControlLeft");
            keyboard.update(now);

            expect(keyboard.bindDown("jump")).toBe(true);
            expect(keyboard.bindDown("crouch")).toBe(true);

            mockKeyup("ControlLeft");
            keyboard.update(now);

            expect(keyboard.bindDown("jump")).toBe(false);
            expect(keyboard.bindDown("crouch")).toBe(false);
        });
    });
});

function mockKeydown(keyCode: string): void
{
    const event = new KeyboardEvent("keydown", { "code": keyCode });
    document.dispatchEvent(event);
}

function mockKeyup(keyCode: string): void
{
    const event = new KeyboardEvent("keyup", { "code": keyCode });
    document.dispatchEvent(event);
}
