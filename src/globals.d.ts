import { ContainerNavigateOptions } from "./lib/navigation/ContainerNavigateOptions";

declare module "pixi.js"
{
  export interface ContainerOptions
  {
    /** @default "auto" */
    navigationMode?: "auto" | "always" | "none";

    /** @default {} */
    navigationLinks?: ContainerNavigateOptions;

    /** @default 0 */
    navigationPriority?: number;

    handledNavigationIntent?(intent: NavigateBinds, device: Device): boolean;
    becameFirstResponder?(): void;
    resignedAsFirstResponder?(): void;
  }

  export interface Container
  {
    /**
     * Whether the container supports device navigation. Enabled when
     * navigationMode is "always", or "auto" and container is interactive.
     */
    readonly navigatable: boolean;

    /**
     * Device navigation mode.
     *
     * - "auto" - Navigatable when the container is interactive.
     * - "always" - Always navigatable even when interactive disabled.
     * - "none" - Navigation is disabled.
     *
     * @default "auto"
     */
    navigationMode: "auto" | "always" | "none";

    /**
     * (Optional) Container navigation links, to override spatial navigation.
     *
     * @example
     * button1.nav.left = button2;
     */
    navigationLinks: ContainerNavigateOptions;

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
