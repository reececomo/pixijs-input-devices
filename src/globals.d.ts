export interface ContainerNavigateOptions
{
    /** Container to navigate to on "NavigateLeft". */
    left?: Container | null;

    /** Container to navigate to on "NavigateRight". */
    right?: Container | null;

    /** Container to navigate to on "NavigateUp". */
    up?: Container | null;

    /** Container to navigate to on "NavigateDown". */
    down?: Container | null;

    /** Container to navigate to on "NavigateBack". */
    back?: Container | null;

    /** Container to navigate to on "NavigateActivate". */
    activate?: Container | null;
}

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
  }

  export interface Container
  {
    /**
     * Whether the container supports device navigation. Enabled when
     * navigationMode is "always", or "auto" and container is interactive and
		 * has at least one of "pointertap", "pointerup", or "pointerdown".
     */
    readonly navigatable: boolean;

    /**
     * Device navigation mode.
     *
     * - "auto" - Navigatable when the container is interactive and
		 *   has at least one of "pointertap", "pointerup", or "pointerdown".
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
     * button1.navigationLinks.left = button2;
     */
    navigationLinks: ContainerNavigateOptions;

    /**
     * Priority used when no container has focus, and navigation is determining
     * the focus target to choose.
     *
     * @default 0
     */
    navigationPriority: number;
  }
}

export {};
