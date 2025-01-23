let _registered = false;

/**
 * Register the mixin for PIXI.Container.
 *
 * @param container A reference to `PIXI.Container`.
 */
export function registerPixiJSNavigationMixin( container: any ): void
{
  if (_registered) return;
  _registered = true;

  const prototype = container.prototype;

  // - Properties:
  prototype.navigationPriority = 0;
  prototype.navigationMode = "auto";

  // - Getters:
  Object.defineProperty(prototype, "isNavigatable", {
    get: function(): boolean
    {
      if ( this.navigationMode === "target" ) return true;
      if ( this.navigationMode === "none" ) return false;

      // if (
      //   this.interactive === false
      //   || (this.isInteractive !== undefined)
      //   && !this.isInteractive()
      // ) return false;

      const onEvents = this.eventNames();

      return onEvents.length > 0 && (
        onEvents.includes( "pointerdown" ) ||
        onEvents.includes( "mousedown" )
      );
    },
    configurable: true,
    enumerable: false,
  });
}
