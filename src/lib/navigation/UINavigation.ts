import { Container } from "pixi.js";

import { Device, InputDevice, NamedBindEvent } from "../InputDevice";
import { Navigate, type NavigateBinds } from "./NavigateBind";
import { NavigationResponder } from "./NavigationResponder";
import { getFirstNavigatable, isChildOf } from "./Navigatable";
import { emitPointerEvent } from "./simulatePointerEvent";


type NavigateBindHandler = (event: NamedBindEvent<NavigateBinds>) => void;
type FocusSource = "pointer" | "device";

const PRESS_BINDS = [ Navigate.Activate, Navigate.Down, Navigate.Right, Navigate.Up, Navigate.Left ];
const RELEASE_BINDS = [ Navigate.Activate, Navigate.Back ];
class NavigationManager
{
    public static global = new NavigationManager();

    /**
     * Navigation options
     */
    public options = {
        /**
         * Minimum distance in a direction that a container has to be to
         * appear as selectable in that direction.
         */
        minimumDirectionDistance: 10.0,

        /**
         * FederatedPointerEvents to fire when navigating containers.
         */
        events: {
            focus   : [ "pointerenter", "pointerover" ],
            down    : [ "pointerdown", ],
            up      : [ "pointerup", "pointertap" ],
            blur    : [ "pointerleave", "pointerout" ],
        },
    };

    /**
     * Current source of navigation device
     */
    public device?: Device;

    /**
     * Pauses all navigation.
     */
    public paused = false;

    /**
     * Current source of navigation focus.
     */
    public focusSource: FocusSource = "pointer";

    private _responders: NavigationResponder[] = [];
    private _rootContainer?: Container;
    private _rootFocused?: Container;
    private _navigateBindsHandler?: NavigateBindHandler;

    private constructor()
    {}

    /**
     * Whether navigation is enabled and NOT paused.
     */
    public get active(): boolean
    {
        return this._rootContainer != null && !this.paused;
    }

    /**
     * Current navigation target.
     */
    public get focusTarget(): Container | undefined
    {
        const responder = this.responders.find($0 => !$0.focusTarget?.destroyed);

        return responder?.focusTarget ?? this._rootFocused;
    }

    public set focusTarget(target: Container | undefined)
    {
        // resets to pointer
        this.setFocus(target, undefined);
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

    /** @deprecated Use `UINavigation.enable(stageRoot)` instead. */
    public configureWithRoot(stageRoot: Container): void
    {
        this.enable(stageRoot);
    }

    /**
     * Initialize navigation and set the root navigation responder.
     *
     * @param stageRoot - Root navigation responder container, where navigatable
     * containers can live.
     */
    public enable(stageRoot: Container): this
    {
        if (this.active)
        {
            // clear existing config
            this.disable();
        }

        // enable stage
        this._rootContainer = stageRoot;

        // setup binds
        this._navigateBindsHandler = (e) => this._handleNavigateBindEvent(e);

        InputDevice
            .onBindDown(PRESS_BINDS, this._navigateBindsHandler)
            .onBindUp(RELEASE_BINDS, this._navigateBindsHandler);

        return this;
    }

    /**
     * Remove the top-most global interaction target
     */
    public popResponder(): NavigationResponder | undefined
    {
        const previousFocused = this.focusTarget;
        const previousResponder = this._responders.shift();

        if (previousResponder)
        {
            previousResponder.focusTarget = undefined;
        }

        const nextFocused = this.focusTarget;

        previousResponder?.resignedAsFirstResponder?.();
        this._invalidateFocusedIfNeeded();

        if (this.firstResponder)
        {
            this.firstResponder.becameFirstResponder?.();
        }

        if (
            previousFocused !== nextFocused
            && (this.firstResponder?.autoFocus ?? !nextFocused)
        )
        {
            this.autoFocus();
        }

        return previousResponder;
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
        if (!UINavigation.active) return;

        const stage = this.getStageContainer();
        if (!stage) return;

        const navigatable = getFirstNavigatable(stage);

        if (navigatable === undefined)
        {
            // early exit: no containers found
            return;
        }

        if (navigatable === this.focusTarget)
        {
            return;
        }

        this.setFocus(navigatable, this.device);
    }

    /**
     * Current root container for navigation.
     */
    public getStageContainer(): Container
    {
        return this.responders.find(isContainer) ?? this._rootContainer;
    }

    public disable(): void
    {
        this._clearNavigateBindsHandler();
        this._rootContainer = undefined;
        this._rootFocused = undefined;
    }

    /**
     * @param target - Container to focus on.
     * @param device - The device setting focus. When omitted, assumes pointer.
     */
    public setFocus(target: Container | undefined | null, device?: Device): void
    {
        if (device)
        {
            this.focusSource = "device";
            this.device = device;
        }
        else
        {
            this.focusSource = "pointer";
            this.device = undefined;
        }

        const previous = this.focusTarget;

        if (previous == target)
        {
            // skip: no change
            return;
        }

        const stage = this.getStageContainer();

        if (!stage)
        {
            // skip: no stage
            return;
        }

        if (target && !target.isNavigatable)
        {
            // skip: target is not navigatable
            return;
        }

        if (target && !isChildOf(target, stage))
        {
            // skip: target is not on stage
            return;
        }

        if (this.firstResponder)
        {
            this.firstResponder.focusTarget = target;
        }
        else
        {
            this._rootFocused = target;
        }

        if (previous)
        {
            this._leave(previous, false);
        }

        if (target)
        {
            this._enter(target);
        }
    }

    // ----- Implementation: -----

    private _clearNavigateBindsHandler(): void
    {
        const handler = this._navigateBindsHandler;

        if (handler)
        {
            this._navigateBindsHandler = undefined;

            InputDevice
                .offBindDown(PRESS_BINDS, handler)
                .offBindUp(RELEASE_BINDS, handler);
        }
    }

    private _handleNavigateBindEvent(event: NamedBindEvent<NavigateBinds>): void
    {
        if (!this.active) return;

        // check responders first
        const { device, name } = event;

        if (event.pressed)
        {
            for (const target of this._responders)
            {
                if (target.handledNavigationIntent?.(name, device))
                {
                    // stop on any responder that acknowledges the intent
                    // as "handled"
                    return;
                }
            }
        }

        // move on to default behavior
        const stage = this.getStageContainer();

        this._invalidateFocusedIfNeeded(stage);

        this.device = device;
        this.focusSource = "device";

        const focusTarget = this.focusTarget;

        // if we currently have no focus target, then find one.
        if (focusTarget === undefined)
        {
            this.autoFocus();

            return;
        }

        // try explicit links first
        if (focusTarget.nav)
        {
            const links = focusTarget.nav;

            const bindLinks = {
                [Navigate.Activate] : links.activate,
                [Navigate.Back]     : links.back,
                [Navigate.Down]     : links.down,
                [Navigate.Left]     : links.left,
                [Navigate.Right]    : links.right,
                [Navigate.Up]       : links.up,
            };

            const linkedContainer = bindLinks[name];

            if (linkedContainer?.isNavigatable)
            {
                this.setFocus(linkedContainer, event.device);

                return;
            }
        }

        // default actions
        if (name === Navigate.Back)
        {
            if (!event.pressed) this._leave(focusTarget);

            return;
        }

        if (name === Navigate.Activate)
        {
            if (event.pressed) this._press(focusTarget);
            else this._release(focusTarget);

            return;
        }

        // spatial navigation
        const nextTarget = getFirstNavigatable(
            stage,
            focusTarget,
            name,
            {
                minimumDistance: this.options.minimumDirectionDistance
            }
        ) ?? focusTarget;

        if (nextTarget === focusTarget)
        {
            // no change, do nothing
            return;
        }

        this.setFocus(nextTarget, event.device);
    }

    private _enter(target: Container): void
    {
        if (this.focusSource !== "device") return;
        emitPointerEvent(target, this.options.events.focus);
    }

    private _press(target: Container): void
    {
        if (this.focusSource !== "device") return;
        emitPointerEvent(target, this.options.events.down);
    }

    private _release(target: Container): void
    {
        if (this.focusSource !== "device") return;
        emitPointerEvent(target, this.options.events.up);
    }

    private _leave(target: Container, clearFocusTarget = true): void
    {
        if (this.focusSource !== "device") return;
        emitPointerEvent(target, this.options.events.blur);

        if (clearFocusTarget)
        {
            this.setFocus(undefined, undefined);
        }
    }

    private _invalidateFocusedIfNeeded(stage?: Container): void
    {
        stage ??= this.getStageContainer();

        if (!stage)
        {
            // skip: no stage
            return;
        }

        const focusTarget = this.focusTarget;

        if (focusTarget && !isChildOf(focusTarget, stage))
        {
            this._leave(focusTarget);
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
