import { Container } from "pixi.js";
import { Device } from "../InputDevice";
import { type NavigateBind } from "./NavigateBind";


/**
 * An event passed to a responder when any of:
 *  - "NavigateLeft"
 *  - "NavigateDown"
 *  - "NavigateRight"
 *  - "NavigateUp"
 *  - "NavigateActivate"
 *  - "NavigateBack"
 * or NavigateBack are issued (i.e. pressed or released).
 */
export interface NavigateEvent
{
    readonly name: NavigateBind;
    readonly device: Device;
    readonly pressed: boolean;
}

/**
 * A target that may control navigation.
 */
export interface NavigationResponder
{
  /**
   * Whether to auto-focus on the element with the highest priority when
   * pushed onto the responder stack.
   *
   * @default true
   */
  autoFocus?: boolean

  /**
   * Currently focused container.
   */
  focusTarget?: Container,

  /**
   * Called when any navigation bind is pressed or released.
   *
   * @return `false` to go up to the next responder, or `true` to end here.
   */
  handledNavigateEvent?(event: NavigateEvent): boolean;

  /**
   * This method is triggered when the target became the first responder.
   *
   * Either when pushed, or when another target stopped being the first
   * responder.
   */
  becameFirstResponder?(): void;

  /**
   * This method is triggered when the target stopped being first responder.
   *
   * Either popped, or another target was pushed on top of the stack.
   */
  resignedAsFirstResponder?(): void;
}
