export type NavigationIntent =
  | "navigateBack"
  | "navigateDown"
  | "navigateLeft"
  | "navigateRight"
  | "navigateUp"
  | "trigger"
;

export const REPEATABLE_NAV_INTENTS: readonly NavigationIntent[] = [
  "navigateLeft", "navigateRight", "navigateUp", "navigateDown"
];
