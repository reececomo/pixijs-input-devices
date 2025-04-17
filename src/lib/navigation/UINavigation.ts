import { Container } from "pixi.js";

import { InputDevice, NamedBindEvent } from "../InputDevice";
import { navigationIntents, type NavigationIntent } from "./NavigationIntent";
import { NavigationResponder } from "./NavigationResponder";
import { getFirstNavigatable, isChildOf, isVisible } from "./Navigatable";


class NavigationManager
{
  public static global = new NavigationManager();

  public options = {
    /**
     * When enabled, if no "pointover"/"mouseover" listeners
     * exist, a default alpha effect will be used instead.
     */
    useFallbackHoverEffect: true,

    /**
     * Minimum distance in a direction that a container has to be to
     * appear as selectable in that direction.
     */
    minimumDirectionDistance: 10,
  };

  /**
   * Whether navigation is enabled globally.
   */
  public enabled = false;

  private _responders: NavigationResponder[] = [];
  private _root?: Container;
  private _rootFocused?: Container;

  private constructor()
  {}

  /**
   * Current navigation target.
   */
  public get focusTarget(): Container | undefined
  {
    return this.responders.find(res =>
      res.focusTarget != null && isVisible(res.focusTarget)
    )?.focusTarget ?? this._rootFocused;
  }

  public set focusTarget(target: Container | undefined)
  {
    const previous = this.focusTarget;

    if (previous === target) return;

    const responderStage = this.getResponderStage();
    if (!responderStage) return;

    if (
      target && (
        !target.isNavigatable
        || !isChildOf(target, responderStage)
      )
    ) return;

    if (previous) this._emitBlur(previous);
    if (target) this._emitFocus(target);

    if (this.firstResponder) this.firstResponder.focusTarget = target;
    else this._rootFocused = target;
  }

  /**
   * Active global interaction target.
   */
  public get firstResponder(): NavigationResponder | undefined
  {
    return this._responders[0];
  }

  /**
   * Stack of global interaction targets.
   */
  public get responders(): readonly NavigationResponder[]
  {
    return this._responders;
  }

  /**
   * Initialize navigation and set the root navigation responder.
   *
   * @param stage - Root navigation responder container, where navigatable
   * containers can live.
   */
  public configureWithRoot(stage: Container): void
  {
    if (this._root == null)
    {
      // register mixin
      // registerPixiJSNavigationMixin(Container);

      // listen to intents
      InputDevice.onBindDown(navigationIntents, (e) => this._propagate(e));
    }

    this._root = stage;
    this.enabled = true;
  }

  /**
   * Remove the top-most global interaction target
   */
  public popResponder(): NavigationResponder | undefined
  {
    const previousFocused = this.focusTarget;

    const responder = this._responders.shift();
    responder.focusTarget = undefined;

    const nextFocused = this.focusTarget;

    responder?.resignedAsFirstResponder?.();
    this._invalidateFocusedIfNeeded();

    if (this.firstResponder)
    {
      this.firstResponder.becameFirstResponder?.();
    }

    if (
      previousFocused !== nextFocused
      && (
        this.firstResponder?.autoFocus
          ?? nextFocused === undefined
      )
    ) this.autoFocus();

    return responder;
  }

  /**
   * Set the new top-most global interaction target.
   */
  public pushResponder(responder: Container | NavigationResponder): void
  {
    const res = responder as NavigationResponder;

    if (this._responders.includes(res))
    {
      throw new Error("Responder already in stack.");
    }

    const previousResponder = this.firstResponder;

    this._responders.unshift(res);

    previousResponder?.resignedAsFirstResponder?.();
    this._invalidateFocusedIfNeeded();

    res.becameFirstResponder?.();
    if (res.autoFocus ?? true) this.autoFocus();
  }

  /**
   * Focus on the first navigatable element.
   */
  public autoFocus(): void
  {
    if (!UINavigation.enabled) return;

    const responderStage = this.getResponderStage();
    if (!responderStage) return;

    const navigatable = getFirstNavigatable(responderStage);

    if (navigatable === undefined)
    {
      // early exit: no containers found
      console.debug("navigation: no navigatable containers found");

      return;
    }

    if (navigatable === this.focusTarget) return;

    this.focusTarget = navigatable;
  }

  /**
   * Current root container for navigation.
   */
  public getResponderStage(): Container
  {
    return this.responders.find(isContainer) ?? this._root;
  }

  // ----- Implementation: -----

  private _propagate({ device, name }: NamedBindEvent<NavigationIntent>): void
  {
    if (!this.enabled) return;

    for (const target of this._responders)
    {
      if (target.handledNavigationIntent?.(name, device))
      {
        // stop on the first responder that acknowledges the intent
        // has been handled
        return;
      }
    }

    // no custom navigation responders were triggered.
    // move on to the default behavior:
    if (this._root == null)
    {
      this.enabled = false;
      throw new Error("Navigation requires root responder to be configured");
    }
    else
    {
      const responderStage = this.getResponderStage();
      this._handleGlobalIntent(responderStage, name);
    }
  }

  private _handleGlobalIntent(
    responderStage: Container,
    intent: NavigationIntent
  ): void
  {
    this._invalidateFocusedIfNeeded(responderStage);

    const focusTarget = this.focusTarget;

    // if we currently have no focus target, then find one.
    if (focusTarget === undefined)
    {
      this.autoFocus();

      return;
    }

    if (intent === "navigate.back")
    {
      this._emitBlur(focusTarget);
      this.focusTarget = undefined;

      return;
    }

    if (intent === "navigate.trigger")
    {
      this._emitTrigger(focusTarget);

      return;
    }

    const nextTarget = getFirstNavigatable(
      responderStage,
      focusTarget,
      intent,
      {
        minimumDistance: this.options.minimumDirectionDistance
      }
    ) ?? focusTarget;

    if (nextTarget === focusTarget)
    {
      // no change, do nothing
      return;
    }

    this.focusTarget = nextTarget;
  }

  private _emitBlur(target: Container): void
  {
    const eventNames = target.eventNames();

    // dispatch default events
    if (eventNames.includes("pointerout")) target.emit("pointerout");
    else if (eventNames.includes("mouseout")) target.emit("mouseout");
    else if (this.options.useFallbackHoverEffect)
    {
      target.alpha = 1.0;
    }

    // always dispatch the blur event
    target.emit("deviceout");
  }

  private _emitFocus(target: Container): void
  {
    const eventNames = target.eventNames();

    // dispatch default events
    if (eventNames.includes("pointerover")) target.emit("pointerover");
    else if (eventNames.includes("mouseover")) target.emit("mouseover");
    else if (this.options.useFallbackHoverEffect)
    {
      target.alpha = 0.5;
    }

    // always dispatch the focus event
    target.emit("deviceover");
  }

  private _emitTrigger(target: Container): void
  {
    const eventNames = target.eventNames();

    // dispatch default events
    if (eventNames.includes("pointerdown")) target.emit("pointerdown");
    else if (eventNames.includes("mousedown")) target.emit("mousedown");
    else if (this.options.useFallbackHoverEffect)
    {
      target.alpha = 0.75;
    }

    // always dispatch the trigger event
    target.emit("devicedown");
  }

  private _invalidateFocusedIfNeeded(
    responderStage = this.getResponderStage(),
  ): void
  {
    if (!responderStage) return;
    const focusTarget = this.focusTarget;

    if (focusTarget && !isChildOf(focusTarget, responderStage))
    {
      this._emitBlur(focusTarget);
      this.focusTarget = undefined;
    }
  }
}

function isContainer(responder: NavigationResponder): responder is NavigationResponder & Container
{
  return "children" in responder;
}

/**
 * Responsible for global navigation interactions.
 *
 * Set stage to enable the global responder behaviors.
 */
export const UINavigation = NavigationManager.global;
