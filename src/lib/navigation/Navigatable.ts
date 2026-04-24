import { Container } from "pixi.js";


type NavigatableContainer = Container;
type NavigateDirection = "NavigateLeft" | "NavigateRight" | "NavigateUp" | "NavigateDown";


export interface SpatialNavigationOptions
{
    minimumDistance: number;
    directionAxisWeight: number;
}

interface NavigatableQueryOptions
{
    currentFocus?: Container;
    direction?: NavigateDirection;
    spatial?: SpatialNavigationOptions;
}

// ----- Navigatable cache -----

/**
 * WeakMap cache: root Container -> flat list of navigatable descendants.
 *
 * The cache is invalidated by `invalidateNavigatablesCache()`.  Call it
 * whenever your UI hierarchy changes (children added/removed, visibility
 * toggled) so that the next spatial-navigation query reflects the new state.
 *
 * UINavigation calls this automatically on `enable`, `disable`,
 * `pushResponder` and `popResponder`.
 */
let _navCache = new WeakMap<Container, NavigatableContainer[]>();

/**
 * Invalidate the navigatable-list cache for a specific root (or the entire
 * cache when no argument is given).
 *
 * Call this after adding/removing navigatable children or changing their
 * `visible` property so the next directional-navigation query stays correct.
 */
export function invalidateNavigatablesCache(root?: Container): void
{
    if (root !== undefined)
    {
        _navCache.delete(root);
    }
    else
    {
        _navCache = new WeakMap();
    }
}

// ----- Core functions -----

/**
 * @returns all navigatable containers in some container.
 *
 * Results are cached per-root; call `invalidateNavigatablesCache(root)` after
 * structural or visibility changes.
 */
export function getAllNavigatables(
    target: Container,
    navigatables?: NavigatableContainer[]
): NavigatableContainer[]
{
    // When an accumulator is passed explicitly (e.g. recursive self-call)
    // we bypass the cache so the caller controls the buffer.
    if (navigatables !== undefined)
    {
        return _collectNavigatables(target, navigatables);
    }

    const cached = _navCache.get(target);
    if (cached !== undefined) return cached;

    const fresh = _collectNavigatables(target, []);
    _navCache.set(target, fresh);

    return fresh;
}

function _collectNavigatables(
    target: Container,
    navigatables: NavigatableContainer[]
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
            _collectNavigatables(child as any, navigatables);
        }
    }

    return navigatables;
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
        spatial,
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

    const focus = focusedElement.getGlobalPosition();

    let filtered = elements
        .filter((element) => element !== focusedElement)
        .map((element) =>
        {
            const { x, y } = element.getGlobalPosition();

            return {
                element,
                x,
                y,
            };
        });

    const { minimumDistance, directionAxisWeight } = spatial;

    switch (direction)
    {
        case "NavigateUp": {
            filtered = filtered.filter((el) => el.y < focus.y - minimumDistance);
            break;
        }

        case "NavigateLeft": {
            filtered = filtered.filter((el) => el.x < focus.x - minimumDistance);
            break;
        }

        case "NavigateRight": {
            filtered = filtered.filter((el) => el.x > focus.x + minimumDistance);
            break;
        }

        case "NavigateDown": {
            filtered = filtered.filter((el) => el.y > focus.y + minimumDistance);
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

            const xWeight = isX ? 1/directionAxisWeight : 1;
            const yWeight = !isX ? 1/directionAxisWeight : 1;

            const dx = (focus.x - value.x) * xWeight;
            const dy = (focus.y - value.y) * yWeight;

            return {
                ...value,
                score: dx*dx + dy*dy,
            };
        })
        .sort((a, b) => a.score - b.score);

    return sorted[0]?.element ?? fallbackElement;
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
