import { Bounds, Container } from "pixi.js";


type NavigatableContainer = Container;
type NavigateDirection = "NavigateLeft" | "NavigateRight" | "NavigateUp" | "NavigateDown";

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

interface NavigatableQueryOptions
{
    currentFocus?: Container;
    direction?: NavigateDirection;
    minimumDistance?: number;
}

/**
 * @returns the first navigatable container in the given direction
 */
export function getFirstNavigatable(
    root: Container,
    options?: NavigatableQueryOptions
): NavigatableContainer | undefined
{
    const containers = getAllNavigatables(root);

    return chooseFirstNavigatableInDirection(containers, options);
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
    options: NavigatableQueryOptions = {},
): NavigatableContainer | undefined
{
    const {
        currentFocus,
        direction,
        minimumDistance = 0,
    } = options;

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
    if (direction === undefined && focusedElement)
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

    const focusedBounds = focusedElement.getBounds();
    const focusedCenter = {
        x: (focusedBounds.minX + focusedBounds.maxX) / 2,
        y: (focusedBounds.minY + focusedBounds.maxY) / 2,
    };

    let filtered = elements
        .filter((element) => element !== focusedElement)
        .map((element) =>
        {
            const bounds = element.getBounds();

            const center = {
                x: (bounds.minX + bounds.maxX) / 2,
                y: (bounds.minY + bounds.maxY) / 2,
            };

            return {
                element,
                bounds,
                center,
            };
        });

    switch (direction)
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
            const isX = direction === "NavigateLeft"
                || direction === "NavigateRight";

            const ALIGNED_AXIS_WEIGHT = 1.0;
            const OTHER_AXIS_WEIGHT = 0.33;

            return {
                ...value,
                score: getDistanceScore(
                    value.bounds,
                    focusedBounds,
                    isX ? OTHER_AXIS_WEIGHT : ALIGNED_AXIS_WEIGHT,
                    isX ? ALIGNED_AXIS_WEIGHT : OTHER_AXIS_WEIGHT
                ),
            };
        })
        .sort((a, b) => a.score - b.score);

    return sorted[0]?.element ?? fallbackElement;
}

export function getDistanceScore(
    a: Bounds,
    b: Bounds,
    weightX = 1,
    weightY = 1
): number
{
    const dx = Math.max(0, Math.max(b.minX - a.maxX, a.minX - b.maxX));
    const dy = Math.max(0, Math.max(b.minY - a.maxY, a.minY - b.maxY));

    const wx = dx * weightX;
    const wy = dy * weightY;

    return wx*wx + wy*wy;
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
