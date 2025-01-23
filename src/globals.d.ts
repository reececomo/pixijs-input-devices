// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as PIXI from 'pixi.js';

/*
 * PixiJs Mixin:
 */

declare module 'pixi.js' {

  export interface Container {

    /**
     * Whether this container is navigatable or not.
     *
     * Set this to "disabled" to manually exclude a container and its children.
     *
     * @default "auto"
     */
    navigationMode?: "auto" | "target" | "disabled" | undefined;

    /**
     * When selecting a default navigation focus target, the
     * target with the largest priority is chosen.
     *
     * @default 0
     */
    navigationPriority: number;

    /**
     * @returns true when navigationMode is "target", or
     * navigationMode is "auto" and the container has an
     * event handler for a "pointerdown" or "mousedown" event.
     */
    readonly isNavigatable: boolean;
  }

}

export {};
