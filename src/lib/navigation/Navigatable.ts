import { Container } from "pixi.js";


type NavigatableContainer = Container;
type NavigationDirection = "navigate.left" | "navigate.right" | "navigate.up" | "navigate.down";

/**
 * @returns all navigatable containers in some container
 */
export function getAllNavigatables(
  target: Container,
  navigatables: NavigatableContainer[] = []
): NavigatableContainer[]
{
  for ( const child of target.children ?? [] )
  {
    if ( ( child as any ).isNavigatable )
    {
      navigatables.push( child as any );
    }
    else
    {
      getAllNavigatables( child as any, navigatables );
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
  const navigatables = getAllNavigatables( root );

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
  while ( child != null )
  {
    if ( child === root ) return true;
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
    .filter( ( el ) =>
      el.isNavigatable
    && el.parent != null
      && isVisible(el)
    );

  // verify currentFocus is in the list of navigatables
  const focusedElement = elements.find( ( el ) => el === currentFocus );

  // no focused element? select the one with the largest priority
  if ( focusedElement === undefined )
  {
    elements.sort( ( a, b ) => b.navigationPriority - a.navigationPriority );

    return elements[0];
  }

  // we already have a focused element, and no direction was specified
  if ( nearestDirection === undefined && focusedElement )
  {
    return focusedElement;
  }

  const fallbackElement =
    focusedElement ?? elements[Math.floor( Math.random() * elements.length )];

  if ( focusedElement === undefined )
  {
    return navigatables[0] ?? fallbackElement;
  }

  const focusedGlobalPos = focusedElement.getGlobalPosition();
  const focusedBounds = focusedElement.getBounds();
  const focusedCenter = {
    x: focusedGlobalPos.x + focusedBounds.left + focusedBounds.width / 2,
    y: focusedGlobalPos.y + focusedBounds.top + focusedBounds.height / 2,
  };

  const otherElements = elements
    .filter( ( el ) => el !== focusedElement )
    .map( ( el ) =>
    {
      const globalPos = el.getGlobalPosition();
      const bounds = el.getBounds();

      const center = {
        x: globalPos.x + bounds.left + bounds.width / 2,
        y: globalPos.y + bounds.top + bounds.height / 2,
      };

      return {
        element: el,
        bounds: bounds,
        center: center,
        xDistSqrd: weightedDistSquared( center, focusedCenter, 1, 3 ),
        yDistSqrd: weightedDistSquared( center, focusedCenter, 3, 1 ),
      };
    });

  switch ( nearestDirection )
  {
    case "navigate.up": {
      const sortedUp = otherElements
        .filter( ( el ) => el.center.y < focusedCenter.y - minimumDistance )
        .sort( ( a, b ) => a.yDistSqrd - b.yDistSqrd );

      return sortedUp[0]?.element ?? fallbackElement;
    }

    case "navigate.left": {
      const sortedLeft = otherElements
        .filter( ( el ) => el.center.x < focusedCenter.x - minimumDistance )
        .sort( ( a, b ) => a.xDistSqrd - b.xDistSqrd );

      return sortedLeft[0]?.element ?? fallbackElement;
    }

    case "navigate.right": {
      const sortedRight = otherElements
        .filter( ( el ) => el.center.x > focusedCenter.x + minimumDistance )
        .sort( ( a, b ) => a.xDistSqrd - b.xDistSqrd );

      return sortedRight[0]?.element ?? fallbackElement;
    }

    case "navigate.down": {
      const sortedDown = otherElements
        .filter( ( el ) => el.center.y > focusedCenter.y + minimumDistance )
        .sort( ( a, b ) => a.yDistSqrd - b.yDistSqrd );

      return sortedDown[0]?.element ?? fallbackElement;
    }

    default: {
      return focusedElement;
    }
  }
}

function weightedDistSquared(
  a: { x: number, y : number },
  b: { x: number, y : number },
  xw: number,
  yw: number
): number
{
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  return dx * dx * xw + dy * dy * yw;
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
