import { Container, FederatedPointerEvent } from "pixi.js";

export function emitPointerEvent(
    target: Container,
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
        target.emit(eventName, createPointerEvent(eventName, point));
    }
}

function createPointerEvent(
    eventName: string,
    point: { x: number; y: number; },
): FederatedPointerEvent
{
    const event = new FederatedPointerEvent(null);

    event.type = "pointerover";
    event.pointerType = "mouse";
    event.pointerId = 1;
    event.button = 0;
    event.buttons = eventName === "pointerup" ? 0 : 1;
    event.isPrimary = true;

    event.client.copyFrom(point);
    event.global.copyFrom(point);

    return event;
}