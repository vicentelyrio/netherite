import { type Clock, Effect } from 'effect'

export const fixedClock = (iso: string): Clock.Clock => {
  const ms = new Date(iso).getTime()
  return {
    currentTimeMillisUnsafe: () => ms,
    currentTimeMillis: Effect.succeed(ms),
    currentTimeNanosUnsafe: () => BigInt(ms) * 1_000_000n,
    currentTimeNanos: Effect.succeed(BigInt(ms) * 1_000_000n),
    monotonicTimeNanosUnsafe: () => 0n,
    monotonicTimeNanos: Effect.succeed(0n),
    sleep: () => Effect.void,
  }
}
