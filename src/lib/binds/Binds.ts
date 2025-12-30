import { NavigateBinds } from "../navigation/NavigateBind";

/**
 * Augment this interface with anything. Values become binds.
 *
 * Keys are ignored but may be useful to categorize bindings.
 *
 * @example
 * declare module "pixijs-input-devices" {
 *     interface Binds {
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
export interface Binds
{
  //
}

export type NamedBind =
  | NavigateBinds
  | Binds[keyof Binds];
