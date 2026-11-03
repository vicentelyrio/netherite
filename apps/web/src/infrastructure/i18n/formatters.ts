import type { FormattersInitializer } from 'typesafe-i18n'
import type { Formatters, Locales } from './i18n-types'

/** Formatters a message can name: `{count:number|thousands}`. Dates are in `infrastructure/datetime`. */
export const initFormatters: FormattersInitializer<Locales, Formatters> = (locale: Locales) => {
  const formatters: Formatters = {
    thousands: (value: number) => new Intl.NumberFormat(locale).format(value),
  }

  return formatters
}
