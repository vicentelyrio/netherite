import { content } from './areas/content'
import { context } from './areas/context'
import { editor } from './areas/editor'
import { freshness } from './areas/freshness'
import { git } from './areas/git'
import { history } from './areas/history'
import { inbox } from './areas/inbox'
import { migration } from './areas/migration'
import { notices } from './areas/notices'
import { performance } from './areas/performance'
import { queries } from './areas/queries'
import { server } from './areas/server'
import { shortcuts } from './areas/shortcuts'
import { watch } from './areas/watch'
import type { DefaultsOf, SettingArea, SettingDefinition } from './settings.types'

const areas = {
  content,
  context,
  editor,
  freshness,
  git,
  history,
  inbox,
  migration,
  notices,
  performance,
  queries,
  server,
  shortcuts,
  watch,
} as const

type Areas = typeof areas

export type SettingDefaults = { readonly [A in keyof Areas]: DefaultsOf<Areas[A]> }

const defaultsOf = (area: SettingArea) =>
  Object.fromEntries(Object.entries(area).map(([key, s]) => [key, s.default]))

export const settingDefaults = Object.fromEntries(
  Object.entries(areas).map(([name, area]) => [name, defaultsOf(area)]),
) as unknown as SettingDefaults

export interface CatalogEntry extends SettingDefinition {
  readonly key: string
  readonly area: string
}

export const settingCatalog: ReadonlyArray<CatalogEntry> = Object.entries(areas).flatMap(
  ([name, area]) =>
    Object.entries(area as SettingArea).map(([key, setting]) => ({
      ...setting,
      key: `${name}.${key}`,
      area: name,
    })),
)
