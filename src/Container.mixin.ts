import { Container } from 'pixi.js';
import { NavigateLinks } from './globals';

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

    const navLinks = new WeakMap<Container, NavigateLinks>();

    // - Properties:
    prototype.navigationPriority = 0;
    prototype.navigationMode = "auto";

    // - Getters:
    Object.defineProperty(prototype, "navigatable", {
        get: function(this: Container): boolean
        {
            if (this.destroyed) return false;

            if (
                this.navigationMode === "always"
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

    Object.defineProperty(prototype, "nav", {
        get: function(this: Container): NavigateLinks
        {
            let nav = navLinks.get(this);

            if (!nav)
            {
                nav = {};
                navLinks.set(this, nav);
            }

            return nav;
        },
        configurable: true,
        enumerable: false,
    });
}
