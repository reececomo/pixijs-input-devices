import { Container } from 'pixi.js';

let _registered = false;

/**
 * Register the mixin for PIXI.Container.
 *
 * @param container A reference to `PIXI.Container`.
 */
export function registerPixiJSNavigationMixin<T = Container>(container: T): void
{
    if (_registered) return;
    _registered = true;

    const prototype: Container = (container as any).prototype;

    // - Properties:
    prototype.navigationPriority = 0;
    prototype.navigationMode = "auto";

    // - Getters:
    Object.defineProperty(prototype, "isNavigatable", {
        get: function(this: Container): boolean
        {
            if (this.destroyed) return false;

            if (
                this.navigationMode === "pointer"
                || this.navigationMode === "target" // legacy
            )
            {
                return true;
            }

            if (
                this.navigationMode !== "auto"
            )
            {
                return false;
            }

            return !!this.interactive;
        },
        configurable: true,
        enumerable: false,
    });
}
