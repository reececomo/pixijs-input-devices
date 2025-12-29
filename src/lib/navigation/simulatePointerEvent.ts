import { Container, FederatedPointerEvent } from "pixi.js";
import { Device } from "../InputDevice";


const fpe = new FederatedPointerEvent(null);

export function emitPointerEvent(
    target: Container,
    device: Device,
    eventNames: string[]
): void
{
    if (target?.destroyed)
    {
        return;
    }

    const point = target.getGlobalPosition(undefined, false);

    for (const eventName of eventNames)
    {
        target.emit(eventName, wrapPointerEvent(device, eventName, point));
    }
}

function wrapPointerEvent(
    device: Device,
    type: string,
    point: { x: number; y: number; },
): FederatedPointerEvent
{
    fpe.type = type;
    fpe.pointerType = device.type === "custom" ? device.id : device.type;
    fpe.pointerId = -1;
    fpe.button = 0;
    fpe.buttons = type === "pointerup" ? 0 : 1;
    fpe.isPrimary = true;

    fpe.client.copyFrom(point);
    fpe.global.copyFrom(point);

    return fpe;
}
