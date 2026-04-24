export const Navigate = Object.freeze({
    Activate: "NavigateActivate",
    Back    : "NavigateBack",
    Down    : "NavigateDown",
    Left    : "NavigateLeft",
    Right   : "NavigateRight",
    Up      : "NavigateUp"
});

export type NavigateBind = typeof Navigate[keyof typeof Navigate];
