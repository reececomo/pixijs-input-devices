import { KeyboardDevice } from "../keyboard/KeyboardDevice";

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

function mockKeydown(keyCode: string, repeat = false): void
{
    const event = new KeyboardEvent("keydown", { code: keyCode, bubbles: true, repeat });
    document.dispatchEvent(event);
}

function mockKeyup(keyCode: string): void
{
    const event = new KeyboardEvent("keyup", { code: keyCode, bubbles: true });
    document.dispatchEvent(event);
}

// -------------------------------------------------------------------

describe("KeyboardDevice — bind index & events", () =>
{
    beforeEach(() =>
    {
        // Reset to clean defaults each test
        KeyboardDevice.importBinds({
            Jump   : ["Space"],
            Crouch : ["ShiftLeft"],
            Dodge  : ["Space", "ShiftLeft"], // two codes → same bind
        });
        KeyboardDevice["_bindsDownCurr"].clear();
        KeyboardDevice["_bindsDownPrev"].clear();
        // Clear all key state
        KeyboardDevice.clear();
    });

    // ---- Bind index correctness ----------------------------------------

    it("bind index maps each KeyCode to its bind names", () =>
    {
        const idx = KeyboardDevice["_bindIndex"] as Map<string, string[]>;

        expect(idx.get("Space")).toContain("Jump");
        expect(idx.get("Space")).toContain("Dodge");
        expect(idx.get("ShiftLeft")).toContain("Crouch");
        expect(idx.get("ShiftLeft")).toContain("Dodge");
        expect(idx.get("KeyA")).toBeUndefined();
    });

    it("rebuild index clears old entries when importBinds(replace) is called", () =>
    {
        KeyboardDevice.importBinds({ Shoot: ["KeyF"] }, "replace");

        const idx = KeyboardDevice["_bindIndex"] as Map<string, string[]>;

        expect(idx.get("KeyF")).toContain("Shoot");
        expect(idx.get("Space")).toBeUndefined();
    });

    it("configureBinds merges and rebuilds index", () =>
    {
        // Reset to empty binds first
        KeyboardDevice.importBinds({}, "replace");
        KeyboardDevice.configureBinds({ Slide: ["KeyC"] });

        const idx = KeyboardDevice["_bindIndex"] as Map<string, string[]>;
        expect(idx.get("KeyC")).toContain("Slide");
    });

    // ---- bindDown / bindPressed / bindReleased -------------------------

    it("bindPressed is true only on the frame the key goes down", () =>
    {
        const now = performance.now();

        // Before any input
        KeyboardDevice.update(now);
        expect(KeyboardDevice.bindPressed("Jump")).toBe(false);

        // Key goes down
        mockKeydown("Space");
        KeyboardDevice.update(now + 16);
        expect(KeyboardDevice.bindDown("Jump")).toBe(true);
        expect(KeyboardDevice.bindPressed("Jump")).toBe(true);
        expect(KeyboardDevice.bindReleased("Jump")).toBe(false);

        // Key held — next frame
        KeyboardDevice.update(now + 32);
        expect(KeyboardDevice.bindDown("Jump")).toBe(true);
        expect(KeyboardDevice.bindPressed("Jump")).toBe(false); // no longer "just pressed"
        expect(KeyboardDevice.bindReleased("Jump")).toBe(false);

        // Key released
        mockKeyup("Space");
        KeyboardDevice.update(now + 48);
        expect(KeyboardDevice.bindDown("Jump")).toBe(false);
        expect(KeyboardDevice.bindPressed("Jump")).toBe(false);
        expect(KeyboardDevice.bindReleased("Jump")).toBe(true); // "just released"

        // Frame after release
        KeyboardDevice.update(now + 64);
        expect(KeyboardDevice.bindReleased("Jump")).toBe(false);
    });

    it("bind with two codes — pressed when either code is down", () =>
    {
        const now = performance.now();

        mockKeydown("Space");
        KeyboardDevice.update(now);
        expect(KeyboardDevice.bindPressed("Dodge")).toBe(true);

        // Second code while first is still down
        mockKeydown("ShiftLeft");
        KeyboardDevice.update(now + 16);
        // Dodge was already down, so pressed should be false (no new edge)
        expect(KeyboardDevice.bindPressed("Dodge")).toBe(false);
    });

    // ---- binddown event fires via bind index --------------------------

    it("binddown event fires exactly once per unique bind per keypress", () =>
    {
        const binddownEvents: string[] = [];

        KeyboardDevice.on("binddown", (e) => binddownEvents.push(e.name));

        const now = performance.now();

        mockKeydown("Space");
        KeyboardDevice.update(now);

        // "Space" matches both Jump and Dodge
        expect(binddownEvents).toContain("Jump");
        expect(binddownEvents).toContain("Dodge");
        expect(binddownEvents.filter(n => n === "Jump").length).toBe(1);
        expect(binddownEvents.filter(n => n === "Dodge").length).toBe(1);

        KeyboardDevice.off("binddown");
    });

    it("repeat key does not emit binddown for non-repeatable binds", () =>
    {
        let count = 0;
        KeyboardDevice.on("binddown", (e) =>
        {
            if (e.name === "Jump") count++;
        });

        const now = performance.now();

        mockKeydown("Space", false);
        KeyboardDevice.update(now);
        expect(count).toBe(1);

        mockKeydown("Space", true); // repeat
        KeyboardDevice.update(now + 16);
        // Jump is not in repeatableBinds, so count should still be 1
        expect(count).toBe(1);

        KeyboardDevice.off("binddown");
    });

    // ---- importBinds round-trip ----------------------------------------

    it("importBinds round-trip restores binds identically", () =>
    {
        KeyboardDevice.configureBinds({ MegaJump: ["KeyM", "Space"] });

        const exported = KeyboardDevice.exportBinds();
        const serialized = JSON.stringify(exported);

        // Clobber binds
        KeyboardDevice.importBinds({}, "replace");
        expect(KeyboardDevice.bindDown("MegaJump")).toBe(false);

        // Restore
        KeyboardDevice.importBinds(JSON.parse(serialized), "replace");
        expect(exported).toEqual(KeyboardDevice.exportBinds());
    });

    it("importBinds emits bindschanged event", () =>
    {
        let fired = false;
        KeyboardDevice.on("bindschanged", () => { fired = true; });
        KeyboardDevice.importBinds({ Fire: ["KeyF"] }, "replace");
        expect(fired).toBe(true);
        KeyboardDevice.off("bindschanged");
    });

    // ---- static configureDefaultBinds ------------------------------------

    it("KeyboardDeviceInstance.configureDefaultBinds forwards to global instance", () =>
    {
        const { KeyboardDeviceInstance } = require("../keyboard/KeyboardDevice");
        KeyboardDeviceInstance.configureDefaultBinds({ StaticBind: ["KeyX"] });

        expect(KeyboardDevice.options.binds["StaticBind"]).toEqual(["KeyX"]);
        expect(KeyboardDevice["_bindIndex"].get("KeyX")).toContain("StaticBind");
    });
});
