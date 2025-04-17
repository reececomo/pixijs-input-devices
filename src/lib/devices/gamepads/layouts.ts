/**
 * Common gamepad platform layouts, which may indicate button layout.
 *
 * Note: Non-comprehensive list, covers the most brands only.
 */
export type GamepadLayout =
    | "amazon_luna"
    | "logitech_g"
    | "nintendo_joycon_l"
    | "nintendo_joycon_r"
    | "nintendo_switch_pro"
    | "nintendo_wiiu"
    | "nvidia_shield"
    | "playstation_4"
    | "playstation_5"
    | "steam_controller"
    | "xbox_360"
    | "xbox_one"
    | "xbox_series"
    | "unknown"
;

/**
 * Automatically detect layout from Gamepad API `id` field.
 *
 * Supports most common device layouts.
 *
 * @see https://github.com/w3c/gamepad/issues/199#issue-2238856541
 */
export function detectLayout(gamepadId: string | undefined): GamepadLayout | undefined
{
    const id = (gamepadId || "").toLowerCase();

    if (/(amazon|luna|1949)/.test(id)) return "amazon_luna";
    if (/(logitech|046d|c216|logicool|^46d)/.test(id)) return "logitech_g";
    if (/(joy-?con.*l|057e.*2006)/.test(id)) return "nintendo_joycon_l";
    if (/(joy-?con.*r|057e.*2007)/.test(id)) return "nintendo_joycon_r";
    if (/(wiiu?|0305|0306|0337)/.test(id)) return "nintendo_wiiu";
    if (/(switch.*pro|nintendo|switch|057e|0300)/.test(id)) return "nintendo_switch_pro";
    if (/(nvidia.*shield|nvidia|shield|0955)/.test(id)) return "nvidia_shield";
    if (/(playstation.*5|dualsense|0df2|0ce6)/.test(id)) return "playstation_5";
    if (/(playstation|sony|dualshock|054c|09cc|0ba0|0810)/.test(id)) return "playstation_4";
    if (/(steam.*controller|steam|28de|1102|1142)/.test(id)) return "steam_controller";
    if (/(xbox.*series|0b00|0b12)/.test(id)) return "xbox_series";
    if (/(xbox.*360|0202|0283|0285|0288|0289|028e|028f|0291|0719)/.test(id)) return "xbox_360";
    if (/(xbox|xinput|045e)/.test(id)) return "xbox_one";

    return undefined;
}
