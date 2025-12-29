import type { Container } from "pixi.js";

export type NavigationMode = "auto" | "none" | "pointer";
type DeprecatedNavigationMode = "target" | "disabled";

/**
 * Allow Containers to set explicit shortcuts for navigation to
 * override the default spatial navigation.
 */
export interface NavigateLinks
{
  /** Container to navigate to on "NavigateLeft". */
  left?: Container;

  /** Container to navigate to on "NavigateRight". */
  right?: Container;

  /** Container to navigate to on "NavigateUp". */
  up?: Container;

  /** Container to navigate to on "NavigateDown". */
  down?: Container;

  /** Container to navigate to on "NavigateBack". */
  back?: Container;

  /** Container to navigate to on "NavigateActivate". */
  activate?: Container;
}

declare module "pixi.js"
{
  export interface Container
  {
    /**
     * @returns true when navigationMode is explictly "pointer", or
     * navigationMode is "auto" and the container is set to interactive.
     */
    readonly isNavigatable: boolean;

    /**
     * Whether this container is device navigatable or not.
     *
     * Set to "none" to exclude an interactive container and its children.
     *
     * @default "auto"
     */
    navigationMode: NavigationMode | DeprecatedNavigationMode;

    /**
     * When selecting a default navigation focus target, the
     * target with the largest priority is chosen.
     *
     * @default 0
     */
    navigationPriority: number;

    /**
     * (Optional) Explicit navigation links for device navigation actions.
     */
    nav?: NavigateLinks;

    // ----- (Optional) NavigationResponder handlers: -----

    /**
     * Called when received a navigation intent. The target should handle, and
     * respond with a boolean indicating whether or not the intent was handled.
     *
     * Unhandled interaction intents will be bubbled up to the next target. You
     * might return `true` here to prevent any intent from being propagated.
     */
    handledNavigationIntent?(
      intent: NavigateBinds,
      device: Device,
    ): boolean;

    /**
     * This method is triggered when the target became the first responder.
     *
     * Either when pushed, or when another target stopped being the first
     * responder.
     */
    becameFirstResponder?(): void;

    /**
     * This method is triggered when the target stopped being first responder.
     *
     * Either popped, or another target was pushed on top of the stack.
     */
    resignedAsFirstResponder?(): void;
  }
}

export {};
