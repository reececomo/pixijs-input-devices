import { Container, Rectangle } from "pixi.js";


type NavigatableContainer = Container;
type NavigationDirection = "NavigateLeft" | "NavigateRight" | "NavigateUp" | "NavigateDown";

/**
 * @returns all navigatable containers in some container
 */
export function getAllNavigatables(
    target: Container,
    navigatables: NavigatableContainer[] = []
): NavigatableContainer[]
{
    for (const child of target.children ?? [])
    {
        if ((child as any).navigatable)
        {
            navigatables.push(child as any);
        }
        else
        {
            getAllNavigatables(child as any, navigatables);
        }
    }

    return navigatables;
}

/**
 * @returns the first navigatable container in the given direction
 */
export function getFirstNavigatable(
    root: Container,
    currentFocus?: Container,
    nearestDirection?: NavigationDirection,
    {
        minimumDistance = 0,
    } = {}
): NavigatableContainer | undefined
{
    const navigatables = getAllNavigatables(root);

    return chooseFirstNavigatableInDirection(
        navigatables,
        currentFocus,
        nearestDirection,
        minimumDistance,
    );
}

export function isChildOf(
    child: Container,
    root: Container
): boolean
{
    while (child != null)
    {
        if (child === root) return true;
        child = child.parent;
    }

    return false;
}


/** @returns the first navigatable container in the given direction */
function chooseFirstNavigatableInDirection(
    navigatables: NavigatableContainer[],
    currentFocus?: Container,
    nearestDirection?: NavigationDirection,
    minimumDistance: number = 0,
): NavigatableContainer | undefined
{
    const elements = navigatables
        .filter((el) =>
            el.navigatable
    && el.parent != null
      && isVisible(el)
        );

    // verify currentFocus is in the list of navigatables
    const focusedElement = elements.find((el) => el === currentFocus);

    // no focused element? select the one with the largest priority
    if (focusedElement === undefined)
    {
        elements.sort((a, b) => b.navigationPriority - a.navigationPriority);

        return elements[0];
    }

    // we already have a focused element, and no direction was specified
    if (nearestDirection === undefined && focusedElement)
    {
        return focusedElement;
    }

    const fallbackElement =
        focusedElement ?? elements[Math.floor(Math.random() * elements.length)];

    // we still dont have a focused element, just choose the first the list
    if (focusedElement === undefined)
    {
        return navigatables[0] ?? fallbackElement;
    }

    // const focusedGlobalPos = focusedElement.getGlobalPosition();
    const focusedBounds = focusedElement.getBounds();
    const focusedCenter = {
        x: (focusedBounds.minX + focusedBounds.maxX) / 2,
        y: (focusedBounds.minY + focusedBounds.maxY) / 2,
    };

    const otherElements = elements
        .filter((el) => el !== focusedElement)
        .map((el) =>
        {
            // const globalPos = el.getGlobalPosition();
            const bounds = el.getBounds();

            const center = {
                x: (bounds.minX + bounds.maxX) / 2,
                y: (bounds.minY + bounds.maxY) / 2,
            };

            return {
                element: el,
                bounds,
                center,
            };
        });

    let filtered = otherElements;

    switch (nearestDirection)
    {
        case "NavigateUp": {
            filtered = filtered.filter((el) => el.center.y < focusedCenter.y - minimumDistance);
            break;
        }

        case "NavigateLeft": {
            filtered = filtered.filter((el) => el.center.x < focusedCenter.x - minimumDistance);
            break;
        }

        case "NavigateRight": {
            filtered = filtered.filter((el) => el.center.x > focusedCenter.x + minimumDistance);
            break;
        }

        case "NavigateDown": {
            filtered = filtered.filter((el) => el.center.y > focusedCenter.y + minimumDistance);
            break;
        }

        default: {
            return focusedElement;
        }
    }

    const sorted = filtered
        .map((value) =>
        {
            const isX = nearestDirection === "NavigateLeft"
                || nearestDirection === "NavigateRight";

            const weightX = isX ? 0.33 : 1;
            const weightY = isX ? 1 : 0.33;

            return {
                ...value,
                weightedDistance: weightedRectDistance(
                    value.element.getBounds().rectangle,
                    focusedBounds.rectangle,
                    weightX,
                    weightY
                ),
            };
        })
        .sort((a, b) => a.weightedDistance - b.weightedDistance);

    return sorted[0]?.element ?? fallbackElement;
}

export function weightedRectDistance(
    a: Rectangle,
    b: Rectangle,
    weightX: number = 1,
    weightY: number = 1
): number
{
    const axMin = a.x;
    const ayMin = a.y;
    const axMax = a.x + a.width;
    const ayMax = a.y + a.height;

    const bxMin = b.x;
    const byMin = b.y;
    const bxMax = b.x + b.width;
    const byMax = b.y + b.height;

    let dx = 0;
    if (axMax < bxMin)
    {
        dx = bxMin - axMax;
    }
    else if (bxMax < axMin)
    {
        dx = axMin - bxMax;
    }

    let dy = 0;
    if (ayMax < byMin)
    {
        dy = byMin - ayMax;
    }
    else if (byMax < ayMin)
    {
        dy = ayMin - byMax;
    }

    // Apply axis weights
    const wx = dx * weightX;
    const wy = dy * weightY;

    return Math.sqrt(wx * wx + wy * wy);
}

export function isVisible(
    target: Container
): boolean
{
    while (target != null)
    {
        if (!target.visible) return false;
        target = target.parent;
    }

    return true;
}
