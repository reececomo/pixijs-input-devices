export abstract class CustomDevice
{
  public readonly id: string;
  public readonly type = "custom";

  /**
   * Associate custom meta data with a device.
   */
  public readonly meta: Record<string, any> = {};

  public lastUpdated = performance.now();

  public constructor( id: string )
  {
    this.id = id;
  }

  /**
   * (Optional) Clear input.
   *
   * This method is triggered when the window is
   * moved to background.
   */
  public clear(): void
  {
    //
  }

  /**
   * Triggered during the polling function.
   */
  public abstract update( now: number ): void;
}
