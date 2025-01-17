import { Device } from "../InputDevice";
import { NavigationIntent } from "./NavigationIntent";

/**
 * A target that responds to navigation on the stack.
 */
export interface NavigationResponder {
  /**
   * Whether to auto-focus on the element with the highest priority when
   * pushed onto the responder stack.
   *
   * @default true
   */
  autoFocus?: boolean

  /**
   * Called when received a navigation intent. The target should handle, and
   * respond with a boolean indicating whether or not the intent was handled.
   *
   * Unhandled interaction intents will be bubbled up to the next target. You
   * might return `true` here to prevent any intent from being propagated.
   */
  handledNavigationIntent?(
    intent: NavigationIntent,
    device: Device,
  ): boolean;

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
