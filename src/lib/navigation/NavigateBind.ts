export type NavigateBinds = typeof Navigate[keyof typeof Navigate];

export const Navigate = Object.freeze({
    Activate    : "NavigateActivate",
    Back        : "NavigateBack",
    Down        : "NavigateDown",
    Left        : "NavigateLeft",
    Right       : "NavigateRight",
    Up          : "NavigateUp"
});
