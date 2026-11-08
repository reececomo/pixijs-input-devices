import { KeyboardDevice } from "../keyboard/KeyboardDevice";
import { Button, GamepadDevice } from "../gamepads/GamepadDevice";
import { Axis } from "../gamepads/buttons";
import { mockGamepadSource } from "./__fixtures__/gamepad";

type Snapshotted = { _bindIndex: Map<string, string[]>; _bindCodes: string[]; _bindCodeNames: string[][] };

function expectDenseIndexInSync(device: unknown): void
{
    const d = device as Snapshotted;

    expect(d._bindCodes).toEqual([...d._bindIndex.keys()]);
    expect(d._bindCodeNames.length).toBe(d._bindCodes.length);

    d._bindCodes.forEach((code, i) =>
    {
        expect(d._bindCodeNames[i]).toBe(d._bindIndex.get(code));
    });
}

function countCalls<T extends object>(target: T, key: PropertyKey, fn: () => void): number
{
    const original = (target as any)[key];
    let calls = 0;

    (target as any)[key] = function (this: unknown, ...args: unknown[])
    {
        calls++;

        return original.apply(this, args);
    };

    try
    {
        fn();
    }
    finally
    {
        (target as any)[key] = original;
    }

    return calls;
}

function countMapIteration(fn: () => void): number
{
    let calls = 0;

    calls += countCalls(Map.prototype, Symbol.iterator, () =>
    {
        calls += countCalls(Map.prototype, "entries", () =>
        {
            calls += countCalls(Map.prototype, "forEach", fn);
        });
    });

    return calls;
}

type BindState = [down: boolean, pressed: boolean, released: boolean];

function bindState(device: { bindDown(n: string): boolean; bindPressed(n: string): boolean; bindReleased(n: string): boolean }, name: string): BindState
{
    return [device.bindDown(name), device.bindPressed(name), device.bindReleased(name)];
}

describe("bind state snapshots", () =>
{
    describe("KeyboardDevice", () =>
    {
        let now = 0;
        const tick = (): void => KeyboardDevice.update(now += 8);

        beforeEach(() =>
        {
            KeyboardDevice.importBinds({
                Jump  : ["Space"],
                Dodge : ["Space", "ShiftLeft"],
                Left  : ["KeyA", "ArrowLeft"],
            });
            KeyboardDevice.clear();
            tick();
            tick();
        });

        it("tracks down, pressed and released across frames", () =>
        {
            KeyboardDevice.key.Space = true;
            tick();
            expect(bindState(KeyboardDevice, "Jump")).toEqual([true, true, false]);
            expect(bindState(KeyboardDevice, "Dodge")).toEqual([true, true, false]);
            expect(bindState(KeyboardDevice, "Left")).toEqual([false, false, false]);

            tick();
            expect(bindState(KeyboardDevice, "Jump")).toEqual([true, false, false]);

            KeyboardDevice.key.ShiftLeft = true;
            KeyboardDevice.key.Space = false;
            tick();
            expect(bindState(KeyboardDevice, "Jump")).toEqual([false, false, true]);
            expect(bindState(KeyboardDevice, "Dodge")).toEqual([true, false, false]);

            KeyboardDevice.key.ShiftLeft = false;
            tick();
            expect(bindState(KeyboardDevice, "Dodge")).toEqual([false, false, true]);

            tick();
            expect(bindState(KeyboardDevice, "Dodge")).toEqual([false, false, false]);
        });

        it("keeps a bind held when switching between its keys", () =>
        {
            KeyboardDevice.key.KeyA = true;
            tick();
            KeyboardDevice.key.ArrowLeft = true;
            KeyboardDevice.key.KeyA = false;
            tick();
            expect(bindState(KeyboardDevice, "Left")).toEqual([true, false, false]);
        });

        it("keeps the dense index in sync with runtime rebinding", () =>
        {
            expectDenseIndexInSync(KeyboardDevice);

            KeyboardDevice.configureBinds({ Fire: ["KeyF", "Space"] } as any);
            expectDenseIndexInSync(KeyboardDevice);

            KeyboardDevice.key.KeyF = true;
            tick();
            expect(bindState(KeyboardDevice, "Fire")).toEqual([true, true, false]);

            KeyboardDevice.importBinds({ Fire: ["KeyG"] }, "replace");
            expectDenseIndexInSync(KeyboardDevice);
            tick();
            expect(bindState(KeyboardDevice, "Fire")).toEqual([false, false, true]);
            expect(bindState(KeyboardDevice, "Jump")).toEqual([false, false, false]);

            KeyboardDevice.key.KeyF = false;
            KeyboardDevice.key.KeyG = true;
            tick();
            expect(bindState(KeyboardDevice, "Fire")).toEqual([true, true, false]);

            KeyboardDevice.importBinds({ Jump: ["Space"] }, "merge");
            expectDenseIndexInSync(KeyboardDevice);

            KeyboardDevice.importBinds({}, "replace");
            expectDenseIndexInSync(KeyboardDevice);
            expect((KeyboardDevice as unknown as Snapshotted)._bindCodes).toEqual([]);
            tick();
            expect(bindState(KeyboardDevice, "Fire")).toEqual([false, false, true]);
        });

        it("does not iterate the bind index map during update()", () =>
        {
            KeyboardDevice.key.Space = true;

            expect(countMapIteration(tick)).toBe(0);
            expect(KeyboardDevice.bindDown("Jump")).toBe(true);
        });
    });

    describe("GamepadDevice", () =>
    {
        let now = 0;

        function makeGamepad(index = 0): { source: Gamepad; gamepad: GamepadDevice; tick: () => void }
        {
            const source = mockGamepadSource({ index });
            const gamepad = new GamepadDevice(source);

            gamepad.options.joystick.autoRepeatDelayMs = [0, 0];
            gamepad.importBinds({
                Jump  : ["Face1"],
                Up    : ["LeftStickUp"],
                Down  : ["LeftStickDown", "DpadDown"],
                Steer : ["LeftStickLeft", "LeftStickRight"],
            });

            return { source, gamepad, tick: () => gamepad.update(source, now += 8) };
        }

        function pressButton(source: Gamepad, button: Button, pressed: boolean): void
        {
            (source.buttons[button] as any).pressed = pressed;
        }

        function setAxis(source: Gamepad, axis: Axis, value: number): void
        {
            (source.axes as number[])[axis] = value;
        }

        it("tracks down, pressed and released across frames", () =>
        {
            const { source, gamepad, tick } = makeGamepad();

            tick();
            pressButton(source, Button.Face1, true);
            tick();
            expect(bindState(gamepad, "Jump")).toEqual([true, true, false]);

            tick();
            expect(bindState(gamepad, "Jump")).toEqual([true, false, false]);

            pressButton(source, Button.Face1, false);
            tick();
            expect(bindState(gamepad, "Jump")).toEqual([false, false, true]);

            tick();
            expect(bindState(gamepad, "Jump")).toEqual([false, false, false]);
        });

        it("pushes and releases an axis in both directions", () =>
        {
            const { source, gamepad, tick } = makeGamepad();
            const events: string[] = [];

            gamepad.on("binddown", (e) => events.push(`down:${e.name}:${e.type === "axis" ? e.axisCode : e.buttonCode}`));
            gamepad.on("bindup", (e) => events.push(`up:${e.name}:${e.type === "axis" ? e.axisCode : e.buttonCode}`));

            tick();

            setAxis(source, Axis.LeftStickY, -0.9);
            tick();
            expect(bindState(gamepad, "Up")).toEqual([true, true, false]);
            expect(bindState(gamepad, "Down")).toEqual([false, false, false]);

            setAxis(source, Axis.LeftStickY, 0);
            tick();
            expect(bindState(gamepad, "Up")).toEqual([false, false, true]);
            expect(gamepad.button.LeftStickUp).toBe(false);

            setAxis(source, Axis.LeftStickY, 0.9);
            tick();
            expect(bindState(gamepad, "Down")).toEqual([true, true, false]);

            setAxis(source, Axis.LeftStickY, 0.1);
            tick();
            expect(bindState(gamepad, "Down")).toEqual([false, false, true]);
            expect(gamepad.button.LeftStickDown).toBe(false);

            expect(events).toEqual([
                "down:Up:LeftStickUp",
                "up:Up:LeftStickUp",
                "down:Down:LeftStickDown",
                "up:Down:LeftStickDown",
            ]);
        });

        it("crosses from negative to positive in one frame", () =>
        {
            const { source, gamepad, tick } = makeGamepad();

            tick();
            setAxis(source, Axis.LeftStickY, -0.9);
            tick();
            expect(bindState(gamepad, "Up")).toEqual([true, true, false]);

            setAxis(source, Axis.LeftStickY, 0.9);
            tick();
            expect(gamepad.button.LeftStickUp).toBe(false);
            expect(gamepad.button.LeftStickDown).toBe(true);
            expect(bindState(gamepad, "Up")).toEqual([false, false, true]);
            expect(bindState(gamepad, "Down")).toEqual([true, true, false]);

            setAxis(source, Axis.LeftStickY, 0);
            tick();
            expect(bindState(gamepad, "Up")).toEqual([false, false, false]);
            expect(bindState(gamepad, "Down")).toEqual([false, false, true]);
        });

        it("emits bindup for the released direction with the resting value", () =>
        {
            const { source, gamepad, tick } = makeGamepad();
            const ups: Array<{ name: string; axis: number; axisCode: string; pressed: boolean; value: number }> = [];

            gamepad.on("bindup", (e) =>
            {
                if (e.type === "axis")
                {
                    ups.push({ name: e.name, axis: e.axis, axisCode: e.axisCode, pressed: e.pressed, value: e.value });
                }
            });

            setAxis(source, Axis.LeftStickX, 0.9);
            tick();
            setAxis(source, Axis.LeftStickX, 0);
            tick();
            setAxis(source, Axis.LeftStickX, -0.9);
            tick();
            setAxis(source, Axis.LeftStickX, 0);
            tick();

            expect(ups).toEqual([
                { name: "Steer", axis: Axis.LeftStickX, axisCode: "LeftStickRight", pressed: false, value: 0 },
                { name: "Steer", axis: Axis.LeftStickX, axisCode: "LeftStickLeft", pressed: false, value: 0 },
            ]);
            expect(bindState(gamepad, "Steer")).toEqual([false, false, true]);
        });

        it("keeps a bind held when switching between its codes", () =>
        {
            const { source, gamepad, tick } = makeGamepad();

            setAxis(source, Axis.LeftStickY, 0.9);
            tick();
            pressButton(source, Button.DpadDown, true);
            setAxis(source, Axis.LeftStickY, 0);
            tick();
            expect(bindState(gamepad, "Down")).toEqual([true, false, false]);
        });

        it("keeps the dense index in sync with runtime rebinding", () =>
        {
            const { source, gamepad, tick } = makeGamepad();

            expectDenseIndexInSync(gamepad);

            gamepad.configureBinds({ Fire: ["Face3", "Face1"] });
            expectDenseIndexInSync(gamepad);

            pressButton(source, Button.Face3, true);
            tick();
            expect(bindState(gamepad, "Fire")).toEqual([true, true, false]);

            gamepad.importBinds({ Fire: ["Face4"] }, "replace");
            expectDenseIndexInSync(gamepad);
            tick();
            expect(bindState(gamepad, "Fire")).toEqual([false, false, true]);

            pressButton(source, Button.Face4, true);
            tick();
            expect(bindState(gamepad, "Fire")).toEqual([true, true, false]);

            gamepad.importBinds({ Jump: ["Face1"] }, "merge");
            expectDenseIndexInSync(gamepad);

            gamepad.importBinds({}, "replace");
            expectDenseIndexInSync(gamepad);
            tick();
            expect(bindState(gamepad, "Fire")).toEqual([false, false, true]);
        });

        it("keeps state separate across multiple gamepads", () =>
        {
            const a = makeGamepad(0);
            const b = makeGamepad(1);

            b.gamepad.importBinds({ Jump: ["Face2"] });

            pressButton(a.source, Button.Face1, true);
            setAxis(b.source, Axis.LeftStickY, -0.9);
            a.tick();
            b.tick();

            expect(bindState(a.gamepad, "Jump")).toEqual([true, true, false]);
            expect(bindState(b.gamepad, "Jump")).toEqual([false, false, false]);
            expect(bindState(a.gamepad, "Up")).toEqual([false, false, false]);
            expect(bindState(b.gamepad, "Up")).toEqual([false, false, false]);

            pressButton(b.source, Button.Face2, true);
            a.tick();
            b.tick();

            expect(bindState(a.gamepad, "Jump")).toEqual([true, false, false]);
            expect(bindState(b.gamepad, "Jump")).toEqual([true, true, false]);

            pressButton(a.source, Button.Face1, false);
            a.tick();
            b.tick();

            expect(bindState(a.gamepad, "Jump")).toEqual([false, false, true]);
            expect(bindState(b.gamepad, "Jump")).toEqual([true, false, false]);
            expectDenseIndexInSync(a.gamepad);
            expectDenseIndexInSync(b.gamepad);
        });

        it("does not iterate the bind index map during update()", () =>
        {
            const { source, gamepad, tick } = makeGamepad();

            pressButton(source, Button.Face1, true);

            expect(countMapIteration(tick)).toBe(0);
            expect(gamepad.bindDown("Jump")).toBe(true);
        });

        it("does not iterate arrays while axes are resting", () =>
        {
            const { gamepad, tick } = makeGamepad();

            tick();

            expect(countCalls(Array.prototype, Symbol.iterator, tick)).toBe(0);
            expect(gamepad.button.LeftStickUp).toBe(false);
        });
    });
});
