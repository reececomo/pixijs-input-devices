import { KeyCode } from "./keys";


export type KeyboardLayout = "QWERTY" | "AZERTY" | "JCUKEN" | "QWERTZ";
export type KeyboardLayoutSource = "browser" | "lang" | "keypress" | "manual";

const MACRO_AZERTY = [
  "fr", // French
  "mg", // Malagasy
  "lu", // Luxembourgish (AZERTY used in Luxembourg)
];

const MACRO_JCUKEN = [
  "ab", // Abkhazian
  "ba", // Bashkir
  "be", // Belarusian
  "bg", // Bulgarian
  "ch", // Chechen
  "kk", // Kazakh
  "ky", // Kyrgyz
  "mk", // Macedonian
  "mn", // Mongolian (Cyrillic script)
  "ru", // Russian
  "sr", // Serbian (Cyrillic script)
  "tg", // Tajik
  "tt", // Tatar
  "uk", // Ukrainian
  "uz", // Uzbek (Cyrillic script)
];

const MACRO_QWERTZ = [
  "de", // German
  "cs", // Czech
  "sk", // Slovak
  "sl", // Slovenian
  "hu", // Hungarian
  "hr", // Croatian
  "bs", // Bosnian
  "ro", // Romanian
  "sq", // Albanian
  "me", // Montenegrin
  "lt", // Lithuanian
  "lv", // Latvian
  "et", // Estonian
];

const JCUKEN_REGEX = /ф|и|с|в|у|а|п|р|ш|о|л|д|ь|т|щ|з|й|к|ы|е|г|м|ц|ч|н|я|ё|х|ъ|б|ю|э|ж|и/i;
const xxERTx_REGEX = /[a-z]/i;

function getLang(): string | undefined
{
  const n = navigator as any;
  if ( n.languages?.length != null ) return n.languages[0]!;
  return n.userLanguage || n.language || n.browserLanguage;
}

/**
 * Detect the actual keyboard layout using navigator API (limited support).
 *
 * @see https://caniuse.com/mdn-api_keyboardlayoutmap
 */
export async function requestKeyboardLayout(): Promise<undefined | KeyboardLayout>
{
  const n = navigator as any;

  if ( !n.keyboard || !n.keyboard.getLayoutMap )
  {
    return undefined; // api unavailable
  }

  try
  {
    const layoutMap = await n.keyboard.getLayoutMap();

    const q = layoutMap.get("KeyQ");
    const a = layoutMap.get("KeyA");
    const z = layoutMap.get("KeyZ");

    if (q === "a" && z === "w" && a === "q") return "AZERTY";
    if (q === "q" && z === "y" && a === "a") return "QWERTZ";
    if (q === "q" && z === "z" && a === "a") return "QWERTY";
    if (q === "й" && z === "я" && a === "ф") return "JCUKEN";
  }
  catch (err)
  {
    console.error( "Error detecting keyboard layout:", err );
  }

  return undefined;
}

/**
 * Infer the current keyboard layout from the language tag.
 *
 * Not reliable.
 */
export function inferKeyboardLayoutFromLang(
  lang: string | undefined = getLang()
): KeyboardLayout
{
  const tag = (lang || "").toLowerCase();
  const macro = tag.split( "-" )[0]!;

  if (
    MACRO_AZERTY.includes( macro )
    || tag.startsWith("nl-be") // Flemish (Belgium)
  ) return "AZERTY";

  if (
    MACRO_JCUKEN.includes(macro)
  ) return "JCUKEN";

  if (
    MACRO_QWERTZ.includes(macro)
    || tag.startsWith("sr-latn") // Serbian (Latin script)
  ) return "QWERTZ";

  return "QWERTY";
}

const _possibleLayouts = new Set<KeyboardLayout>([ "AZERTY", "JCUKEN", "QWERTY", "QWERTZ" ]);
export function detectKeyboardLayoutFromKeydown(
  event: KeyboardEvent
): KeyboardLayout | undefined
{
  const key = event.key.toLowerCase();
  const code = event.code;

  // JCUKEN exclusive
  if (
    JCUKEN_REGEX.test(key)
  )
  {
    _possibleLayouts.delete("AZERTY");
    _possibleLayouts.delete("QWERTY");
    _possibleLayouts.delete("QWERTZ");
  }

  // AZERTY exclusive
  else if (
    code === "Backquote" && key === "²" ||
    code === "BracketLeft" && key === "«" ||
    code === "BracketRight" && key === "»" ||
    code === "KeyA" && key === "q" ||
    code === "KeyQ" && key === "a" ||
    code === "KeyW" && key === "z" ||
    code === "KeyZ" && key === "w"
  )
  {
    _possibleLayouts.delete("JCUKEN");
    _possibleLayouts.delete("QWERTY");
    _possibleLayouts.delete("QWERTZ");
  }

  // QWERTZ exclusive
  else if (
    code === "BracketLeft" && key === "ü" ||
    code === "BracketRight" && key === "ö" ||
    code === "KeyY" && key === "z" ||
    code === "KeyZ" && key === "y" ||
    code === "Slash" && key === "-"
  )
  {
    _possibleLayouts.delete("AZERTY");
    _possibleLayouts.delete("JCUKEN");
    _possibleLayouts.delete("QWERTY");
  }

  // QWERTY exclusive
  else if (
    code === "BracketLeft" && key === "[" ||
    code === "BracketRight" && key === "]" ||
    code === "KeyZ" && key === "z"
  )
  {
    _possibleLayouts.delete("AZERTY");
    _possibleLayouts.delete("JCUKEN");
    _possibleLayouts.delete("QWERTZ");
  }

  // QWERTx
  else if (
    code === "KeyQ" && key === "q" ||
    code === "KeyW" && key === "w"
  )
  {
    _possibleLayouts.delete("AZERTY");
    _possibleLayouts.delete("JCUKEN");
  }

  // xxERTY
  else if (
    code === "KeyY" && key === "Y"
  )
  {
    _possibleLayouts.delete("QWERTZ");
    _possibleLayouts.delete("JCUKEN");
  }

  // xxERTx
  else if (
    xxERTx_REGEX.test(key)
  )
  {
    _possibleLayouts.delete("JCUKEN");
  }

  return _possibleLayouts.size === 1
    ? [ ..._possibleLayouts ][0]
    : undefined;
}

// lazy init:
let _labels: undefined | Record<KeyboardLayout, Record<KeyCode, string>>;

export function getLayoutLabel( key: KeyCode, layout: KeyboardLayout ): string
{
  if (_labels === undefined)
  {
    const QWERTY_LABELS: Record<KeyCode, string> = {
      ArrowLeft: "←",
      ArrowRight: "→",
      ArrowUp: "↑",
      ArrowDown: "↓",
      AltLeft: "Left Alt",
      AltRight: "Right Alt",
      Backquote: "`",
      Backslash: "\\",
      Backspace: "Backspace",
      BracketLeft: "[",
      BracketRight: "]",
      CapsLock: "Caps Lock",
      Comma: ",",
      ContextMenu: "Context Menu",
      ControlLeft: "Left Ctrl",
      ControlRight: "Right Ctrl",
      Delete: "Delete",
      Digit0: "0",
      Digit1: "1",
      Digit2: "2",
      Digit3: "3",
      Digit4: "4",
      Digit5: "5",
      Digit6: "6",
      Digit7: "7",
      Digit8: "8",
      Digit9: "9",
      End: "End",
      Enter: "Enter",
      Equal: "=",
      Escape: "Esc",
      F1: "F1",
      F2: "F2",
      F3: "F3",
      F4: "F4",
      F5: "F5",
      F6: "F6",
      F7: "F7",
      F8: "F8",
      F9: "F9",
      F10: "F10",
      F11: "F11",
      F12: "F12",
      F13: "F13",
      F14: "F14",
      F15: "F15",
      F16: "F16",
      F17: "F17",
      F18: "F18",
      F19: "F19",
      F20: "F20",
      F21: "F21",
      F22: "F22",
      F23: "F23",
      F24: "F24",
      F25: "F25",
      F26: "F26",
      F27: "F27",
      F28: "F28",
      F29: "F29",
      F30: "F30",
      F31: "F31",
      F32: "F32",
      Home: "Home",
      IntlBackslash: "\\",
      IntlRo: "Ro",
      IntlYen: "¥",
      KeyA: "A",
      KeyB: "B",
      KeyC: "C",
      KeyD: "D",
      KeyE: "E",
      KeyF: "F",
      KeyG: "G",
      KeyH: "H",
      KeyI: "I",
      KeyJ: "J",
      KeyK: "K",
      KeyL: "L",
      KeyM: "M",
      KeyN: "N",
      KeyO: "O",
      KeyP: "P",
      KeyQ: "Q",
      KeyR: "R",
      KeyS: "S",
      KeyT: "T",
      KeyU: "U",
      KeyV: "V",
      KeyW: "W",
      KeyX: "X",
      KeyY: "Y",
      KeyZ: "Z",
      Lang1: "Language 1",
      Lang2: "Language 2",
      MediaTrackNext: "Next Track",
      MediaTrackPrevious: "Previous Track",
      MetaLeft: "Left " + getMetaKeyLabel(),
      MetaRight: "Right " + getMetaKeyLabel(),
      Minus: "-",
      NumLock: "Num Lock",
      Numpad0: "Num0",
      Numpad1: "Num1",
      Numpad2: "Num2",
      Numpad3: "Num3",
      Numpad4: "Num4",
      Numpad5: "Num5",
      Numpad6: "Num6",
      Numpad7: "Num7",
      Numpad8: "Num8",
      Numpad9: "Num9",
      NumpadAdd: "+",
      NumpadComma: ",",
      NumpadDecimal: ".",
      NumpadDivide: "/",
      NumpadMultiply: "*",
      NumpadSubtract: "-",
      OSLeft: "OS Left",
      Pause: "Pause",
      Period: ".",
      Quote: "'",
      ScrollLock: "Scroll Lock",
      Semicolon: ";",
      ShiftLeft: "Left Shift",
      ShiftRight: "Right Shift",
      Slash: "/",
      Space: "Space",
      Tab: "Tab",
      VolumeDown: "Volume Down",
      VolumeMute: "Mute",
      VolumeUp: "Volume Up",
      WakeUp: "Wake Up",
    };

    const AZERTY_LABELS: Record<KeyCode, string> = {
      ...QWERTY_LABELS,
      KeyA: "Q",
      KeyQ: "A",
      KeyW: "Z",
      KeyZ: "W",
      Backquote: "²",
      BracketLeft: "«",
      BracketRight: "»",
    };

    const JCUKEN_LABELS: Record<KeyCode, string> = {
      ...QWERTY_LABELS,
      KeyA: "Ф",
      KeyB: "И",
      KeyC: "С",
      KeyD: "В",
      KeyE: "У",
      KeyF: "А",
      KeyG: "П",
      KeyH: "Р",
      KeyI: "Ш",
      KeyJ: "О",
      KeyK: "Л",
      KeyL: "Д",
      KeyM: "Ь",
      KeyN: "Т",
      KeyO: "Щ",
      KeyP: "З",
      KeyQ: "Й",
      KeyR: "К",
      KeyS: "Ы",
      KeyT: "Е",
      KeyU: "Г",
      KeyV: "М",
      KeyW: "Ц",
      KeyX: "Ч",
      KeyY: "Н",
      KeyZ: "Я",
      Backquote: "Ё",
      BracketLeft: "х",
      BracketRight: "ъ",
      Comma: "Б",
      Period: "Ю",
      Quote: "Э",
      Semicolon: "Ж",
      Slash: "И",
    };

    const QWERTZ_LABELS: Record<KeyCode, string> = {
      ...QWERTY_LABELS,
      KeyY: "Z",
      KeyZ: "Y",
      BracketLeft: "ü",
      BracketRight: "ö",
      Slash: "-",
    };

    _labels = {
      AZERTY: AZERTY_LABELS,
      JCUKEN: JCUKEN_LABELS,
      QWERTY: QWERTY_LABELS,
      QWERTZ: QWERTZ_LABELS,
    };
  }

  return _labels[layout][key];
}

function getMetaKeyLabel(): string
{
  const n = navigator as any;
  const platform = n.platform?.toLowerCase() ?? "";
  const userAgent = n.userAgent?.toLowerCase() ?? "";
  if (platform.includes("mac")) return "⌘"; // macOS - Command key
  if (platform.includes("win")) return "⊞"; // Windows - Windows key
  if (platform.includes("linux")) return "⊞"; // Linux - Super key
  if (userAgent.includes("android")) return "Search";
  if (userAgent.includes("iphone") || userAgent.includes("ipad")) return "⌘";
  return "⊞"; // Windows key
}
