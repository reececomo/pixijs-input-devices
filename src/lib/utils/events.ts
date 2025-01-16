export class EventEmitter<EType>
{
  private readonly _listeners: { [E in keyof EType]?: ((e: EType[E]) => void)[] } = {};

  public hasListener<E extends keyof EType>( e: E ): boolean
  {
    return this._listeners[e] !== undefined;
  }

  public emit<E extends keyof EType>(e: E, payload: EType[E]): void
  {
    this._listeners[e]?.forEach( (fn) => fn(payload) );
  }

  public on<E extends keyof EType>(event: E, fn: (event: EType[E]) => void): void
  {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event]?.push(fn);
  }

  public off<E extends keyof EType>(event: E, fn?: (event: EType[E]) => void): void
  {
    this._listeners[event] = fn === undefined ? undefined : this._listeners[event]?.filter((l) => l !== fn);
    if ( this._listeners[event]?.length === 0 ) this._listeners[event] = undefined;
  }
}
