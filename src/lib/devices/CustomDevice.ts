export interface CustomDevice
{
  readonly type: "custom";
  readonly id: string;
  readonly meta: Record<string, any>;

  /** Timestamp when input was last modified. */
  readonly lastInteraction: number;

  /** Triggered during the polling function. */
  update(now: number): void;

  /**
   * (Optional) Clear input.
   *
   * This method is triggered when the window is
   * moved to background.
   */
  clear?(): void;
}
