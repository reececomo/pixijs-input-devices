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
    //
    // ----- Properties: -----
    //

    /**
     * @returns true when navigationMode is set to "always", or
     * when "auto" and the container is interactive.
     */
    readonly navigatable: boolean;

    /**
     * Device navigation mode.
     *
     * - "auto" - Navigatable when the container is interactive.
     * - "always" - Always navigatable even when interactivity is disabled.
     * - "none" - Navigation is disabled.
     *
     * @default "auto"
     */
    navigationMode: "auto" | "always" | "none" | /* deprecated: */ ("target" | "disabled");

    /**
     * (Optional) Container navigation links, to override spatial navigation.
     *
     * @example
     * button1.nav.left = button2;
     */
    nav: NavigateLinks;

    /**
     * Priority used when no container has focus, and navigation is determining
     * the focus target to choose.
     *
     * @default 0
     */
    navigationPriority: number;

    //
    // ----- (Optional) NavigationResponder handlers: -----
    //

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
