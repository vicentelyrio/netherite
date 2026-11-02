import dayjs, { type Dayjs } from 'dayjs'

let current: () => Dayjs = () => dayjs()

/** The current moment. Everything that depends on "now" reads it here, so a test can set it. */
export const now = (): Dayjs => current()

/** Replaces the clock; give a fixed date to make "2 days ago" and "due in 3 days" repeatable. */
export const setClock = (at: string | number | Date | Dayjs): void => {
  const fixed = dayjs(at)
  current = () => fixed
}

/** Puts the real clock back. */
export const resetClock = (): void => {
  current = () => dayjs()
}
