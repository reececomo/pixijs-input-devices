/**
 * Register the mixin for PIXI.Container.
 *
 * @param container A reference to `PIXI.Container`.
 */
export function registerPixiJSInputDeviceMixin(container: any): void
{
  const prototype = container.prototype;

  // - Properties:
  prototype.navigationPriority = 0;
  prototype.navigationMode = "auto";

  // - Getters:
  Object.defineProperty(prototype, "isNavigatable", {
    get: function(): boolean
    {
      if ( this.navigationMode === "auto" )
      {
        if ( ! this.isInteractive ) return false;

        const onEvents = this.eventNames();

        return onEvents.includes("pointerdown")
          || onEvents.includes("mousedown");
      }

      return this.navigationMode === "target";
    },
    configurable: true,
    enumerable: false,
  });
}
