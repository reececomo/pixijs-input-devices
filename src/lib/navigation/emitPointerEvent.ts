import { Container, FederatedPointerEvent, Point, PointData } from "pixi.js";
import { Device } from "../InputDevice";


const _federatedPointerEvent = new FederatedPointerEvent(null);
const _globalPosition = new Point();

export function emitPointerEvent(
    target: Container,
    device: Device,
    eventNames: string[]
): void
{
    if (target?.destroyed)
    {
        // skip: container destroyed
        return;
    }

    const point = target.getGlobalPosition(_globalPosition, false);

    for (const eventName of eventNames)
    {
        target.emit(eventName, toPointerEvent(device, eventName, point));
    }
}

function toPointerEvent(device: Device, type: string, point: PointData): FederatedPointerEvent
{
    const pointerType = device.type === "custom"
        ? device.id
        : device.type;

    const buttons = type === "pointerup"
        ? 0
        : 1;

    _federatedPointerEvent.type = type;
    _federatedPointerEvent.pointerType = pointerType;
    _federatedPointerEvent.pointerId = -1;
    _federatedPointerEvent.button = 0;
    _federatedPointerEvent.buttons = buttons;
    _federatedPointerEvent.isPrimary = true;

    _federatedPointerEvent.client.copyFrom(point);
    _federatedPointerEvent.global.copyFrom(point);

    return _federatedPointerEvent;
}
