import { NavigateBind } from "../navigation/NavigateBind";

/**
 * Augment this interface with anything. Values become binds.
 *
 * Keys are ignored but may be useful to categorize bindings.
 *
 * @example
 * declare module "pixijs-input-devices" {
 *     interface BindValues {
 *         Gameplay:
 *             | "Crouch"
 *             | "Jump"
 *             | "Sprint";
 *
 *         General:
 *             | "Options"
 *             | "Pause";
 *     }
 * }
 */
export interface BindValues
{
}

export type IBind =
  | NavigateBind
  | BindValues[keyof BindValues];
