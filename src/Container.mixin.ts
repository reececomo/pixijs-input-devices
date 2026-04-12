import { Container } from 'pixi.js';
import { ContainerNavigateOptions } from './lib/navigation/ContainerNavigateOptions';

let _registered = false;

const AUTO_EVENTS = new Set<string>([
    "pointerdown",
    "pointerup",
    "pointertap",
]);

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
    const navigationLinks = new WeakMap<Container, ContainerNavigateOptions>();

    // - Properties:
    prototype.navigationMode = "auto";
    prototype.navigationPriority = 0;

    // - Getters:
    Object.defineProperty(prototype, "navigatable", {
        get: function(this: Container): boolean
        {
            if (this.destroyed)
            {
                return false;
            }

            switch (this.navigationMode)
            {
                case "always": return true;
                case "none": return false;

                default:
                    return this.isInteractive() && this.eventNames().some((name: string) => AUTO_EVENTS.has(name));
            }
        },
        configurable: true,
        enumerable: false,
    });

    Object.defineProperty(prototype, "navigationLinks", {
        get: function(this: Container): ContainerNavigateOptions
        {
            let value = navigationLinks.get(this);

            if (value == null)
            {
                value = this.navigationLinks = {};
            }

            return value;
        },
        set: function(this: Container, value?: ContainerNavigateOptions | null)
        {
            navigationLinks.set(this, value);

            this.on("destroyed", () => navigationLinks.delete(this));
        },
        configurable: true,
        enumerable: false,
    });
}
