import type { Freshness } from '../freshness'

export type Period = '30d' | 'quarter' | 'year'

export interface Delta {
  readonly value: number
  readonly previous?: number
}

export interface PeriodStats {
  readonly period: Period
  readonly from: string
  readonly to: string
  readonly kpis: {
    readonly created: Delta
    readonly done: Delta
    readonly cycleDays: Delta | null
    readonly commits: Delta
    readonly staleDocs: Delta
    readonly linked?: {
      readonly percent: number
      readonly total: number
      readonly previous?: number
    }
  }
  readonly throughput: ReadonlyArray<{
    readonly start: string
    readonly created: number
    readonly done: number
  }>
  readonly areas: ReadonlyArray<{
    readonly area: string
    readonly goals: number
    readonly share: number
    readonly gained: number
    readonly achieved: number
    readonly achievedGoals: ReadonlyArray<string>
    readonly idleGoals: ReadonlyArray<string>
    readonly goalRows: ReadonlyArray<{
      readonly title: string
      readonly share: number
      readonly gained: number
    }>
    readonly idle: number
  }>
  readonly projects: ReadonlyArray<{
    readonly id: string
    readonly title: string
    readonly done: number
    readonly cycleDays: number | null
  }>
  readonly heat: {
    readonly from: string
    readonly to: string
    readonly days: ReadonlyArray<{ readonly date: string; readonly count: number }>
  }
  readonly knowledge: {
    readonly freshness: {
      readonly fresh: number
      readonly drifting: number
      readonly stale: number
      readonly notTracked: number
    }
    readonly decisions: Readonly<Record<string, number>>
    readonly decided: Readonly<Record<string, number>>
    readonly undocumented: ReadonlyArray<{
      readonly path: string
      readonly commits: number
      readonly last: string
    }>
  }
  readonly areaNames: ReadonlyArray<string>
  readonly approximate: boolean
}

export interface PeriodOptions {
  readonly period: Period
  readonly now?: string
  readonly freshness?: ReadonlyMap<string, Freshness>
  readonly linkage?: {
    readonly current: { readonly total: number; readonly linked: number }
    readonly previous: { readonly total: number; readonly linked: number }
  }
  readonly undocumented?: ReadonlyArray<{
    readonly path: string
    readonly commits: number
    readonly last: string
  }>
  readonly area?: string
}
