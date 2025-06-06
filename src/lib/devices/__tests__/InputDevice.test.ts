import { InputDevice } from "../../InputDevice";
import { CustomDevice } from "../CustomDevice";

describe("lastInteractedDevice", () =>
{
    it("returns the most recently interacted device (or the first if multiple)", () =>
    {
        InputDevice.options.requireDocumentFocus = false;

        const device1 = new MockDevice("device-1");
        const device2 = new MockDevice("device-2");

        InputDevice.add(device1);
        InputDevice.add(device2);

        expect(InputDevice.devices).toHaveLength(2);
        expect(InputDevice.lastInteractedDevice).toBe(undefined);

        device1.input = 0.5;
        device2.input = 0.5;
        InputDevice.update();
        expect(InputDevice.lastInteractedDevice).toBe(device1);

        device1.input = 0.5; // no change
        device2.input = 0.75;
        InputDevice.update();
        expect(InputDevice.lastInteractedDevice).toBe(device2);

        device1.input = 0.51111;
        device2.input = 0.76111;
        InputDevice.update();
        expect(InputDevice.lastInteractedDevice).toBe(device1);

        device1.input = 0.1;
        device2.input = 0.1;
        InputDevice.update();
        expect(InputDevice.lastInteractedDevice).toBe(device1);
    });
});

class MockDevice implements CustomDevice
{
    public type = "custom" as const;
    public meta: Record<string, any> = {};
    public lastInteraction: number = 0;

    public input = 0;
    private _lastInput = 0;

    public constructor(public id: string)
    {}

    public update(now: number): void
    {
        if (this.input !== this._lastInput)
        {
            this.lastInteraction = now;
            this._lastInput = this.input;
        }
    }

    public bindDown(name: string): boolean
    {
        return false; // no bind support
    }

    public playHaptic(): void
    {
        // no haptic support
    }
}
