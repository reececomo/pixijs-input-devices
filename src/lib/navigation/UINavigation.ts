import { Container } from "pixi.js";

import { Device, InputDevice, NamedBindEvent } from "../InputDevice";
import { Navigate, type NavigateBind } from "./NavigateBind";
import { NavigationResponder } from "./NavigationResponder";
import { getFirstNavigatable, isChildOf, SpatialNavigationOptions } from "./Navigatable";
import { emitPointerEvent } from "./emitPointerEvent";
import { ContainerNavigateOptions } from "./ContainerNavigateOptions";


type FocusSource = "pointer" | "device";

const navigationLinkKeys: Record<NavigateBind, keyof ContainerNavigateOptions> = {
    [Navigate.Activate] : "activate",
    [Navigate.Back]     : "back",
    [Navigate.Down]     : "down",
    [Navigate.Left]     : "left",
    [Navigate.Right]    : "right",
    [Navigate.Up]       : "up",
};

class NavigationManager
{
    public static global = new NavigationManager();

    /**
     * Navigation options
     */
    public options = {
        /**
         * Spatial navigation options.
         */
        spatial: {
            /**
             * Minimum distance in a direction that a container has to be
             * from the global position of the container to appear as the
             * next option.
             *
             * @default 10
             */
            minimumDistance: 10,

            /**
             * Search preference given to containers along the same axis
             * as the navigation intent.
             *
             * @default 2.5
             */
            directionAxisWeight: 2.5,
        } satisfies SpatialNavigationOptions,

        /**
         * FederatedPointerEvents to fire when navigating containers.
         */
        events: {
            /**
             * FederatedPointerEvents to fire when a Container becomes the
             * UINavigation focus target.
             *
             * @default [ "pointerenter", "pointerover" ]
             */
            focus: [ "pointerenter", "pointerover" ],

            /**
             * FederatedPointerEvents to fire when a Container stops being
             * the UINavigation focus target.
             *
             * @default [ "pointerleave", "pointerout" ]
             */
            blur: [ "pointerleave", "pointerout" ],

            /**
             * FederatedPointerEvents to fire on the UINavigation focus target
             * when a press ("NavigateActivate") starts.
             *
             * @default [ "pointerdown" ]
             */
            press: [ "pointerdown" ],

            /**
             * FederatedPointerEvents to fire on the UINavigation focus target
             * when a press ("NavigateActivate") is released.
             *
             * @default [ "pointerup", "pointertap" ]
             */
            release: [ "pointerup", "pointertap" ],
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
    private _clearBinds?: () => void;

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
        const handler = (e: NamedBindEvent<NavigateBind>): void =>
            this._handleNavigateBindEvent(e);

        const navigateBinds = [
            Navigate.Left,
            Navigate.Down,
            Navigate.Right,
            Navigate.Up,
            Navigate.Activate,
            Navigate.Back,
        ];

        InputDevice.onBindDownUp(navigateBinds, handler);
        this._clearBinds = () => InputDevice.offBindDownUp(navigateBinds, handler);

        return this;
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
        this._clearFocusTargetIfRemoved();

        res.becameFirstResponder?.();
        if (res.autoFocus ?? true) this.autoFocus();
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
        this._clearFocusTargetIfRemoved();

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
    public setTopMostResponder(responder: Container | NavigationResponder): void
    {
        const res = responder as NavigationResponder;
        const previousResponder = this.firstResponder;

        // If it's already the top responder, do nothing
        if (previousResponder === res) return;

        // Remove responder if it already exists in the stack
        const index = this._responders.indexOf(res);
        if (index !== -1)
        {
            this._responders.splice(index, 1);
        }

        // Promote to top
        this._responders.unshift(res);

        previousResponder?.resignedAsFirstResponder?.();
        this._clearFocusTargetIfRemoved();

        res.becameFirstResponder?.();
        if (res.autoFocus ?? true) this.autoFocus();
    }

    /**
     * Removes the responder if in the responders list.
     */
    public removeResponder<T extends Container | NavigationResponder>(
        responder: T,
        popAllAbove: boolean = false
    ): T | undefined
    {
        const res = responder as NavigationResponder;
        const index = this._responders.indexOf(res);

        if (index === -1) return undefined;

        const previousFocused = this.focusTarget;
        const previousFirstResponder = this.firstResponder;

        let removed: NavigationResponder | undefined;

        if (popAllAbove)
        {
            // Remove responder and everything above it
            const removedResponders = this._responders.splice(0, index + 1);
            removed = removedResponders[removedResponders.length - 1];

            for (const r of removedResponders)
            {
                r.focusTarget = undefined;
            }
        }
        else
        {
            // Remove only the specified responder
            removed = this._responders.splice(index, 1)[0];
            removed.focusTarget = undefined;
        }

        const nextFocused = this.focusTarget;

        // Only trigger lifecycle changes if first responder changed
        if (previousFirstResponder !== this.firstResponder)
        {
            previousFirstResponder?.resignedAsFirstResponder?.();
            this._clearFocusTargetIfRemoved();
            this.firstResponder?.becameFirstResponder?.();
        }

        if (
            previousFocused !== nextFocused
            && (this.firstResponder?.autoFocus ?? !nextFocused)
        )
        {
            this.autoFocus();
        }

        return removed as T;
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

        if (target && !target.navigatable)
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

        if (previous) this._blur(previous, false);
        if (target) this._focus(target);
    }

    // ----- Implementation: -----

    private _clearNavigateBindsHandler(): void
    {
        this._clearBinds?.();
        this._clearBinds = undefined;
    }

    private _handleNavigateBindEvent(event: NamedBindEvent<NavigateBind>): void
    {
        if (!this.active) return;

        const bind = event.name;
        const device = event.device;

        // update nav device
        this.device = device;
        this.focusSource = "device";

        // check responders first
        if (this._responders.some(r => r.handledNavigateEvent?.(event)))
        {
            return;
        }

        // default behavior:
        this._clearFocusTargetIfRemoved();

        const focusTarget = this.focusTarget;

        if (focusTarget === undefined)
        {
            if (!event.pressed)
            {
                // autofocus on release
                this.autoFocus();
            }

            // early exit: if we currently have no focus target, then find one.
            return;
        }

        // check explicit navigation link
        const key = navigationLinkKeys[bind];
        const linkedContainer = focusTarget.navigationLinks[key];

        if (linkedContainer?.navigatable)
        {
            if (event.pressed)
            {
                this.setFocus(linkedContainer, device);
            }

            return;
        }

        switch (bind)
        {
            case Navigate.Activate:
                if (event.pressed) this._press(focusTarget);
                else this._release(focusTarget);

                return;

            case Navigate.Back:
                if (event.pressed) return; // issue on releases only

                this._blur(focusTarget);

                return;

            default: {
                if (!event.pressed) return; // issue on presses only

                // spatial navigation
                const stage = this.getStageContainer()!;

                const spatialTarget = getFirstNavigatable(stage, {
                    direction: bind,
                    currentFocus: focusTarget,
                    spatial: this.options.spatial,
                });

                if (spatialTarget && spatialTarget !== focusTarget)
                {
                    this.setFocus(spatialTarget, event.device);
                }
            }
        }
    }

    private _focus(target: Container): void
    {
        if (!this.device || this.focusSource !== "device") return;
        emitPointerEvent(target, this.device, this.options.events.focus);
    }

    private _press(target: Container): void
    {
        if (!this.device || this.focusSource !== "device") return;
        emitPointerEvent(target, this.device, this.options.events.press);
    }

    private _release(target: Container): void
    {
        if (!this.device || this.focusSource !== "device") return;
        emitPointerEvent(target, this.device, this.options.events.release);
    }

    private _blur(target: Container, clearFocusTarget = true): void
    {
        if (!this.device || this.focusSource !== "device") return;
        emitPointerEvent(target, this.device, this.options.events.blur);

        if (clearFocusTarget)
        {
            this.setFocus(undefined, undefined);
        }
    }

    private _clearFocusTargetIfRemoved(stage?: Container): void
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
            this._blur(focusTarget);
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
