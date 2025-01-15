/**
 * Common gamepad platform layouts, which may indicate button layout.
 *
 * Note: Non-comprehensive list, covers the most brands only.
 */
export type GamepadLayout = "logitech" | "nintendo" | "playstation" | "steam" | "xbox" | "generic";

/**
 * Automatically detect layout from Gamepad API `id` field.
 *
 * Unforunately these are not stable, but the most common ones
 *
 * @see https://github.com/w3c/gamepad/issues/199#issue-2238856541
 */
export function detectLayout( gamepad: Gamepad ): GamepadLayout
{
  const id = ( gamepad.id || "" ).toLowerCase();

  if ( /(steam|28de)/.test( id ) ) return "steam";
  if ( /(logitech|046d|c216)/.test( id ) ) return "logitech";
  if ( /(nintendo|switch|joycon|057e)/.test ( id ) ) return "nintendo";
  if ( /(dualshock|dualsense|sony|054c|0ce6|0810)/.test( id ) ) return "playstation";
  if ( /(xbox|xinput|045e|028e|0291|02a0|02a1|02ea|02ff)/.test( id ) ) return "xbox";

  return "generic";
}
