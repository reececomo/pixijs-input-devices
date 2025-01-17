// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as PIXI from 'pixi.js';

/*
 * PixiJs Mixin:
 */

declare module 'pixi.js' {

  export interface Container {

    /**
     * @returns true when navigationMode is "target", or
     * navigationMode is "auto" and the container handles
     * either "pointerdown" or "mousedown" events.
     */
    readonly isNavigatable: boolean;

    /**
     * When selecting a default navigation focus target, the
     * target with the largest priority is chosen.
     * @default 0
     */
    navigationPriority: number;

    /**
     * Whether this container is explicitly navigatable or not.
     */
    navigationMode?: "auto" | "target" | "disabled" | undefined;
  }

}

export {};
