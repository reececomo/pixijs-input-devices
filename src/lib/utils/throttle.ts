let _cooldowns = new Map<string, number>();

export function throttle(id: string, cooldownMs: number): boolean
{
  const now = Date.now();

  if ((_cooldowns.get(id) ?? 0) > now) return true;

  _cooldowns.set(id, now + cooldownMs);

  return false;
}
