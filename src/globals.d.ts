import type { Container } from "pixi.js";

export type NavigationMode = "auto" | "none" | "pointer";
type DeprecatedNavigationMode = "target" | "disabled";

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
     * @returns true when navigationMode is "target", or
     * navigationMode is "auto" and the container has an
     * event handler for a "pointerdown" event.
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
  }
}

export {};
