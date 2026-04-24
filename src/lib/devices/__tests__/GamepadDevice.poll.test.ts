import { InputDevice } from "../../InputDevice";
import { Button, GamepadDevice } from "../gamepads/GamepadDevice";
import { Axis } from "../gamepads/buttons";
import { mockGamepadSource } from "./__fixtures__/gamepad";

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

function makeGamepad(overrides?: Partial<Gamepad>): { source: Gamepad; gamepad: GamepadDevice }
{
    const source = mockGamepadSource(overrides);
    const gamepad = new GamepadDevice(source);

    gamepad.configureBinds({
        Jump   : ["Face1"],
        Crouch : ["Face2", "LeftStickDown"],
    });

    return { source, gamepad };
}

// -------------------------------------------------------------------

describe("GamepadDevice — poll & events", () =>
{
    // ---- Bind index --------------------------------------------------

    it("bind index maps button codes correctly after configureBinds", () =>
    {
        const { gamepad } = makeGamepad();
        const idx = gamepad["_bindIndex"] as Map<string, string[]>;

        expect(idx.get("Face1")).toContain("Jump");
        expect(idx.get("Face2")).toContain("Crouch");
        expect(idx.get("LeftStickDown")).toContain("Crouch");
        expect(idx.get("Face3")).toBeUndefined();
    });

    // ---- bindPressed / bindReleased -----------------------------------

    it("bindPressed is true only on the frame a button goes down", () =>
    {
        const { source, gamepad } = makeGamepad();
        const now = Date.now();

        // Initial state
        gamepad.update(source, now);
        expect(gamepad.bindPressed("Jump")).toBe(false);
        expect(gamepad.bindReleased("Jump")).toBe(false);

        // Press Face1
        (source.buttons[Button.Face1] as any).pressed = true;
        gamepad.update(source, now + 16);
        expect(gamepad.bindDown("Jump")).toBe(true);
        expect(gamepad.bindPressed("Jump")).toBe(true);
        expect(gamepad.bindReleased("Jump")).toBe(false);

        // Hold — next frame
        gamepad.update(source, now + 32);
        expect(gamepad.bindDown("Jump")).toBe(true);
        expect(gamepad.bindPressed("Jump")).toBe(false);
        expect(gamepad.bindReleased("Jump")).toBe(false);

        // Release
        (source.buttons[Button.Face1] as any).pressed = false;
        gamepad.update(source, now + 48);
        expect(gamepad.bindDown("Jump")).toBe(false);
        expect(gamepad.bindPressed("Jump")).toBe(false);
        expect(gamepad.bindReleased("Jump")).toBe(true);

        // Frame after release
        gamepad.update(source, now + 64);
        expect(gamepad.bindReleased("Jump")).toBe(false);
    });

    // ---- binddown event fires exactly once per edge ------------------

    it("binddown event fires exactly once per press edge", () =>
    {
        const { source, gamepad } = makeGamepad();
        const now = Date.now();

        const events: string[] = [];
        gamepad.on("binddown", (e) => events.push(e.name));

        (source.buttons[Button.Face1] as any).pressed = true;
        gamepad.update(source, now);
        expect(events.filter(n => n === "Jump").length).toBe(1);

        // Held down — no new events expected
        const before = events.length;
        gamepad.update(source, now + 16);
        expect(events.length).toBe(before);
    });

    it("bindup event fires exactly once per release edge", () =>
    {
        const { source, gamepad } = makeGamepad();
        const now = Date.now();

        const upEvents: string[] = [];
        gamepad.on("bindup", (e) => upEvents.push(e.name));

        // Press then release
        (source.buttons[Button.Face1] as any).pressed = true;
        gamepad.update(source, now);
        (source.buttons[Button.Face1] as any).pressed = false;
        gamepad.update(source, now + 16);

        expect(upEvents.filter(n => n === "Jump").length).toBe(1);
    });

    // ---- Deadzone behavior -------------------------------------------

    it("joystick below deadzone is not considered pressed", () =>
    {
        const { source, gamepad } = makeGamepad();
        const now = Date.now();

        (source.axes[Axis.LeftStickY] as any) = 0.1; // within default deadzone
        gamepad.update(source, now);

        expect(gamepad.button.LeftStickDown).toBe(false);
    });

    it("joystick above press threshold registers press", () =>
    {
        const { source, gamepad } = makeGamepad();
        const now = Date.now();

        (source.axes[Axis.LeftStickY] as any) = 0.7; // above 0.5 threshold
        gamepad.update(source, now);

        expect(gamepad.button.LeftStickDown).toBe(true);
    });

    it("releases both left-stick vertical directions when returning to neutral", () =>
    {
        const { source, gamepad } = makeGamepad();
        const now = Date.now();

        // Push up first to ensure mixed up/down transitions don't latch state.
        (source.axes[Axis.LeftStickY] as any) = -0.7;
        gamepad.update(source, now);
        expect(gamepad.button.LeftStickUp).toBe(true);
        expect(gamepad.button.LeftStickDown).toBe(false);

        // Then push down.
        (source.axes[Axis.LeftStickY] as any) = 0.7;
        gamepad.update(source, now + 16);
        expect(gamepad.button.LeftStickUp).toBe(false);
        expect(gamepad.button.LeftStickDown).toBe(true);

        // Return to neutral: both directions should reset.
        (source.axes[Axis.LeftStickY] as any) = 0;
        gamepad.update(source, now + 32);
        expect(gamepad.button.LeftStickUp).toBe(false);
        expect(gamepad.button.LeftStickDown).toBe(false);
    });

    // ---- importBinds round-trip --------------------------------------

    it("importBinds round-trip restores binds identically", () =>
    {
        const { gamepad } = makeGamepad();

        const exported = gamepad.exportBinds();
        const serialized = JSON.stringify(exported);

        gamepad.importBinds({}, "replace");
        expect(gamepad.bindDown("Jump")).toBe(false);

        gamepad.importBinds(JSON.parse(serialized), "replace");
        expect(gamepad.exportBinds()).toEqual(exported);
    });

    it("importBinds emits bindschanged event", () =>
    {
        const { gamepad } = makeGamepad();
        let fired = false;

        gamepad.on("bindschanged", () =>
        {
            fired = true;
        });
        gamepad.importBinds({ Fire: ["Face3"] }, "replace");
        expect(fired).toBe(true);
    });

    // ---- Bulk InputDevice export/import ------------------------------

    it("InputDevice.exportBinds / importBinds round-trips keyboard + gamepads", () =>
    {
        InputDevice.options.requireDocumentFocus = false;

        const { gamepad } = makeGamepad();
        InputDevice.add(gamepad);

        const snapshot = InputDevice.exportBinds();

        // Serialise → deserialise
        const restored = JSON.parse(JSON.stringify(snapshot));

        // Change binds on both
        InputDevice.keyboard.importBinds({}, "replace");
        gamepad.importBinds({}, "replace");

        InputDevice.importBinds(restored, "replace");

        expect(InputDevice.keyboard.exportBinds()).toEqual(snapshot.keyboard);
        expect(gamepad.exportBinds()).toEqual(snapshot.gamepads[gamepad.id]);

        InputDevice.remove(gamepad);
    });
});
