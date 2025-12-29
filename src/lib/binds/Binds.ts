import { NavigateBinds } from "../navigation/NavigateBind";

/**
 * Augmentable with keyed values that are your Bind Keys
 */
export interface Binds
{
}

export type NamedBind =
  | NavigateBinds
  | Binds[keyof Binds];
