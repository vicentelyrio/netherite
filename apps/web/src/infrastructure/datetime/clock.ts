import dayjs, { type Dayjs } from 'dayjs'

let current: () => Dayjs = () => dayjs()

export const now = (): Dayjs => current()

export const setClock = (at: string | number | Date | Dayjs): void => {
  const fixed = dayjs(at)
  current = () => fixed
}

export const resetClock = (): void => {
  current = () => dayjs()
}
