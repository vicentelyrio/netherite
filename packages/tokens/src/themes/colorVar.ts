import { color } from '../color'
import { kebab, prefix } from '../css/names'
import type { ColorSet } from './themes.types'

const refs = (value: object, path: ReadonlyArray<string>): object =>
  Object.fromEntries(
    Object.entries(value).map(([key, child]) => {
      const next = [...path, kebab(key)]
      return [
        key,
        typeof child === 'string'
          ? `var(${prefix}color-${next.join('-')})`
          : refs(child as object, next),
      ]
    }),
  )

export const colorVar = refs(color, []) as ColorSet
