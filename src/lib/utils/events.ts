export class EventEmitter<EType>
{
  private l: { [E in keyof EType]?: ((e: EType[E]) => void)[] } = {};

  public hasListener<E extends keyof EType>( e: E ): boolean
  {
    return this.l[e] !== undefined;
  }

  public emit<E extends keyof EType>(e: E, payload: EType[E]): void
  {
    this.l[e]?.forEach( (fn) => fn(payload) );
  }

  public on<E extends keyof EType>(event: E, fn: (event: EType[E]) => void): void
  {
    if (!this.l[event]) this.l[event] = [];
    this.l[event]?.push(fn);
  }

  public off<E extends keyof EType>(event: E, fn?: (event: EType[E]) => void): void
  {
    this.l[event] = fn === undefined ? undefined : this.l[event]?.filter((l) => l !== fn);
    if ( this.l[event]?.length === 0 ) this.l[event] = undefined;
  }
}
