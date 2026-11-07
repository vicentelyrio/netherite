import type { FieldIssue } from '@netherite/schema'
import { raisedRules } from '../raised'
import type { ConfigEdit } from './spliceConfig'

const Writable = {
  Value: 'value',
  Rules: 'rules',
  States: 'states',
} as const

type WritableLeaf = (typeof Writable)[keyof typeof Writable]
type WritableShape = WritableLeaf | { readonly [key: string]: WritableShape }

export const writableConfig: WritableShape = {
  states: Writable.States,
  freshness: { drifting: Writable.Value, stale: Writable.Value },
  context: { budget: Writable.Value, targets: Writable.Value },
  inbox: { rules: Writable.Rules },
}

export interface ConfigPlan {
  readonly edits: ReadonlyArray<ConfigEdit>
  readonly issues: ReadonlyArray<FieldIssue>
}

const empty: ConfigPlan = { edits: [], issues: [] }

const refuse = (path: ReadonlyArray<string>, message: string): ConfigPlan => ({
  edits: [],
  issues: [{ path, message }],
})

const merge = (plans: ReadonlyArray<ConfigPlan>): ConfigPlan =>
  plans.reduce(
    (all, plan) => ({
      edits: [...all.edits, ...plan.edits],
      issues: [...all.issues, ...plan.issues],
    }),
    empty,
  )

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const planRule = (path: ReadonlyArray<string>, rule: string, value: unknown): ConfigPlan => {
  const at = [...path, rule]
  if (!(raisedRules as ReadonlyArray<string>).includes(rule))
    return refuse(at, `"${rule}" is not an Inbox rule`)
  if (typeof value !== 'boolean') return refuse(at, 'An Inbox rule is either true or false')
  return { edits: [{ path: at, value }], issues: [] }
}

const planStates = (path: ReadonlyArray<string>, value: unknown): ConfigPlan => {
  const list: ReadonlyArray<unknown> = Array.isArray(value) ? value : []
  const names = list.map((state) => (isRecord(state) ? state.name : undefined))
  const repeated = names.findIndex((name, i) => name !== undefined && names.indexOf(name) !== i)
  return repeated < 0
    ? { edits: [{ path, value }], issues: [] }
    : refuse([...path, String(repeated), 'name'], `"${String(names[repeated])}" is used twice`)
}

const leafPlanners: Readonly<
  Record<WritableLeaf, (path: ReadonlyArray<string>, value: unknown) => ConfigPlan>
> = {
  [Writable.Value]: (path, value) => ({ edits: [{ path, value }], issues: [] }),
  [Writable.States]: planStates,
  [Writable.Rules]: (path, value) =>
    isRecord(value)
      ? merge(Object.entries(value).map(([rule, on]) => planRule(path, rule, on)))
      : refuse(path, 'Expected a map of Inbox rules'),
}

const plan = (shape: WritableShape, value: unknown, path: ReadonlyArray<string>): ConfigPlan => {
  if (typeof shape === 'string') return leafPlanners[shape](path, value)
  if (!isRecord(value)) return refuse(path, 'Expected a map')
  return merge(
    Object.entries(value).map(([key, inner]) => {
      const at = [...path, key]
      const next = Object.hasOwn(shape, key) ? shape[key] : undefined
      return next === undefined
        ? refuse(at, `"${at.join('.')}" cannot be changed from the app`)
        : plan(next, inner, at)
    }),
  )
}

export const planConfigEdits = (set: unknown): ConfigPlan => plan(writableConfig, set, [])
