export const utcDay = (iso: string) => {
  if (iso.length <= 10) return iso
  const time = Date.parse(iso)
  return Number.isNaN(time) ? iso.slice(0, 10) : new Date(time).toISOString().slice(0, 10)
}

export const weekStart = (date: string) => {
  const d = new Date(`${utcDay(date)}T00:00:00Z`)
  const back = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - back)
  return d.toISOString().slice(0, 10)
}

export const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export const weeksBetween = (from: string, to: string) => {
  const weeks: string[] = []
  for (let week = weekStart(from); week <= weekStart(to); week = addDays(week, 7)) weeks.push(week)
  return weeks
}

export interface WeekRange {
  readonly from?: string
  readonly to?: string
}

export interface WeekCount {
  readonly week: string
  readonly count: number
}
