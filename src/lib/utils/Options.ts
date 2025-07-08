export const Options = {
    /**
     * When the window loses focus, this triggers the clear
     * input function.
     *
     * @default true
     */
    clearInputOnBackground: true,

    /**
     * Require window/document to be in foreground.
     *
     * @default true
     */
    requireDocumentFocus: true,

    /**
     * Prevents haptics on a device that hasn't received any interaction lately.
     * Set to `<= 0` to disable.
     *
     * @default 0
     */
    supressHapticsInactivityPeriodMs: 0,
};