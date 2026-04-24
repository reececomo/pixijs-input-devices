import { GamepadHapticManager } from "../gamepads/GamepadHapticManager";

// -------------------------------------------------------------------
// Fake gamepad with a mock vibrationActuator
// -------------------------------------------------------------------

function makeHapticManager(): { manager: GamepadHapticManager; playEffect: jest.Mock }
{
    const playEffect = jest.fn();

    const fakeGamepad = {
        index: 0,
        vibrationActuator: {
            effects: ["trigger-rumble"],
            playEffect,
            reset: jest.fn(),
        },
    } as unknown as Gamepad;

    const manager = new GamepadHapticManager(fakeGamepad);
    return { manager, playEffect };
}

// -------------------------------------------------------------------

describe("GamepadHapticManager", () =>
{
    beforeEach(() =>
    {
        jest.useFakeTimers();
    });

    afterEach(() =>
    {
        jest.useRealTimers();
    });

    it("overlapping effects take the per-channel maximum", () =>
    {
        const { manager, playEffect } = makeHapticManager();

        const now = performance.now();

        manager.play({ rumble: 0.3, buzz: 0.0, duration: 500 }, 1.0);
        manager.play({ rumble: 0.8, buzz: 0.5, duration: 500 }, 1.0);

        manager.update();

        // Should have called playEffect — with the max values
        expect(playEffect).toHaveBeenCalledWith(
            "trigger-rumble",
            expect.objectContaining({
                strongMagnitude: 0.8,
                weakMagnitude  : 0.5,
            })
        );
    });

    it("expired effects are removed without reallocation", () =>
    {
        const { manager } = makeHapticManager();

        // Spy on the internal array to verify it is mutated in-place
        const activeEffects = manager["activeEffects"] as unknown[];

        manager.play({ rumble: 0.5, duration: 10 }, 1.0);
        manager.play({ rumble: 0.5, duration: 10 }, 1.0);
        expect(activeEffects.length).toBe(2);

        // Advance time past both effects' end
        jest.advanceTimersByTime(100);
        manager.update();

        // Same array reference, length zeroed
        expect(manager["activeEffects"]).toBe(activeEffects);
        expect(activeEffects.length).toBe(0);
    });

    it("reset() clears all active effects", () =>
    {
        const { manager } = makeHapticManager();

        manager.play({ rumble: 0.9, duration: 2000 }, 1.0);
        manager.play({ rumble: 0.4, duration: 2000 }, 1.0);
        expect(manager["activeEffects"].length).toBe(2);

        manager.reset();
        expect(manager["activeEffects"].length).toBe(0);
    });

    it("intensity scalar is applied to all channels", () =>
    {
        const { manager, playEffect } = makeHapticManager();

        manager.play({ rumble: 1.0, buzz: 1.0, duration: 500 }, 0.5);
        manager.update();

        expect(playEffect).toHaveBeenCalledWith(
            "trigger-rumble",
            expect.objectContaining({
                strongMagnitude: 0.5,
                weakMagnitude  : 0.5,
            })
        );
    });
});
