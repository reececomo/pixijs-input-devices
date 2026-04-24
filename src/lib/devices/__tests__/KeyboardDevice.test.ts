import { KeyboardDevice } from "../keyboard/KeyboardDevice";

describe("KeyboardDevice", () =>
{
    describe("named binds", () =>
    {
        it("correctly maps named binds to their buttons", () =>
        {
            const now = Date.now();
            const keyboard = KeyboardDevice;

            keyboard.configureBinds({
                Jump: [ "Space", "ControlLeft" ],
                Crouch: [ "ControlLeft", "ShiftLeft" ],
            });

            expect(keyboard.bindDown("Jump")).toBe(false);
            expect(keyboard.bindDown("Crouch")).toBe(false);

            mockKeydown("ShiftLeft");
            keyboard.update(now);

            expect(keyboard.bindDown("Jump")).toBe(false);
            expect(keyboard.bindDown("Crouch")).toBe(true);

            mockKeyup("ShiftLeft");
            keyboard.update(now);

            expect(keyboard.bindDown("Jump")).toBe(false);
            expect(keyboard.bindDown("Crouch")).toBe(false);

            mockKeydown("ControlLeft");
            keyboard.update(now);

            expect(keyboard.bindDown("Jump")).toBe(true);
            expect(keyboard.bindDown("Crouch")).toBe(true);

            mockKeyup("ControlLeft");
            keyboard.update(now);

            expect(keyboard.bindDown("Jump")).toBe(false);
            expect(keyboard.bindDown("Crouch")).toBe(false);
        });
    });
});

function mockKeydown(keyCode: string): void
{
    const event = new KeyboardEvent("keydown", { code: keyCode });
    document.dispatchEvent(event);
}

function mockKeyup(keyCode: string): void
{
    const event = new KeyboardEvent("keyup", { code: keyCode });
    document.dispatchEvent(event);
}
