import { Container } from "pixi.js";

import { Device } from "../InputDevice";
import { NavigationIntent } from "./NavigationIntent";
import { NavigationResponder } from "./NavigationResponder";
import { getFirstNavigatable } from "./Navigatable";


class NavigationManager
{
  public static global = new NavigationManager();

  /**
   * Set the stage root to automatically handle global
   * navigation intents.
   */
  public stage?: Container;

  /**
   * When enabled, if no pointover/mouseover listeners
   * exist, a default effect will be used instead.
   */
  public fallbackEffects = true;

  private _focused?: Container;
  private _responderStack: NavigationResponder[] = [];
  private constructor()
  {}

  /**
   * Active global interaction target
   */
  public get firstResponder(): NavigationResponder | undefined
  {
    return this._responderStack[0];
  }

  /**
   * Stack of global interaction targets
   */
  public get responders(): readonly NavigationResponder[]
  {
    return this._responderStack;
  }

  /**
   * Emit interaction intent to the first responder,
   * or the global responder if none.
   */
  public commit(
    intent: NavigationIntent,
    device: Device,
  ): void
  {
    this._propagateIntent( intent, device);
  }

  /**
   * Remove the top-most global interaction target
   */
  public popResponder(): NavigationResponder | undefined
  {
    const responder = this._responderStack.shift();

    this.firstResponder?.becameFirstResponder?.();
    responder?.resignedAsFirstResponder?.();

    return responder;
  }

  /**
   * Set the new top-most global interaction target.
   */
  public pushResponder( responder: NavigationResponder ): void
  {
    if ( this._responderStack.includes( responder ) )
    {
      throw new Error( "Responder already in stack." );
    }

    const previousResponder = this.firstResponder;

    this._responderStack.unshift( responder );

    responder.becameFirstResponder?.();
    previousResponder?.resignedAsFirstResponder?.();
  }

  // ----- Implementation: -----

  private _propagateIntent(
    intent: NavigationIntent,
    device: Device,
  ): void
  {
    for ( const target of this._responderStack )
    {
      if ( target.handledNavigationIntent?.( intent, device ) )
      {
        // stop on the first responder that acknowledges the intent
        // has been handled
        return;
      }
    }

    // no custom navigation responders were triggered.
    // move on to the default behavior:
    if ( this.stage === undefined )
    {
      console.warn( "navigation: no stage root set" );
    }
    else
    {
      this._handleGlobalIntent( this.stage, intent );
    }
  }

  private _handleGlobalIntent(
    root: Container,
    intent: NavigationIntent
  ): void
  {
    // if we currently have no focus target, then find one.
    if ( this._focused === undefined )
    {
      const navigatable = getFirstNavigatable( root );

      if ( navigatable === undefined )
      {
        // early exit: no navigatable views found
        console.debug( "navigation: no navigatable views found", intent );
        return;
      }

      this._emitFocus( navigatable );
      this._focused = navigatable;

      return;
    }

    if ( intent === "navigateBack" )
    {
      this._emitBlur( this._focused );
      this._focused = undefined;

      return;
    }

    if ( intent === "trigger" )
    {
      this._emitTrigger( this._focused );

      return;
    }

    const nextTarget = getFirstNavigatable( this.stage, this._focused, intent ) ?? this._focused;

    if ( nextTarget === this._focused )
    {
      // no change, do nothing
      return;
    }

    this._emitBlur( this._focused );
    this._emitFocus( nextTarget );
    this._focused = nextTarget;
  }

  private _emitBlur( target: Container): void
  {
    const eventNames = target.eventNames();

    // dispatch default events
    if ( eventNames.includes( "pointerout" ) ) target.emit( "pointerout" );
    else if ( eventNames.includes( "mouseout" ) ) target.emit( "mouseout" );
    else if ( target.navigationMode === "auto" && this.fallbackEffects )
    {
      target.alpha = 1.0;
    }

    // always dispatch the blur event
    target.emit( "blur" );
  }

  private _emitFocus( target: Container ): void
  {
    const eventNames = target.eventNames();

    // dispatch default events
    if ( eventNames.includes( "pointerover" ) ) target.emit( "pointerover" );
    else if ( eventNames.includes( "mouseover" ) ) target.emit( "mouseover" );
    else if ( target.navigationMode === "auto" && this.fallbackEffects )
    {
      target.alpha = 0.5;
    }

    // always dispatch the blur event
    target.emit( "focus" );
  }

  private _emitTrigger( target: Container ): void
  {
    const eventNames = target.eventNames();

    // dispatch default events
    if ( eventNames.includes( "pointerdown" ) ) target.emit( "pointerdown" );
    else if ( eventNames.includes( "mousedown" ) ) target.emit( "mousedown" );
    else if ( target.navigationMode === "auto" && this.fallbackEffects )
    {
      target.alpha = 0.75;
    }

    // always dispatch the blur event
    target.emit( "trigger" );
  }
}

/**
 * Responsible for global navigation interactions.
 *
 * Set stage to enable the global responder behaviors.
 */
export const Navigation = NavigationManager.global;
