export const navigationIntents = [
    "navigate.left",
    "navigate.right",
    "navigate.up",
    "navigate.down",
    "navigate.back",
    "navigate.trigger",
] as const;

export type NavigationIntent = typeof navigationIntents[number];
