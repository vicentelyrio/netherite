import type { ShortcutScope } from './actions'
import { isEditable } from './isEditable'
import { isModifierKey } from './isModifierKey'
import { isOverlayOpen } from './isOverlayOpen'
import { isSidebarFocused } from './isSidebarFocused'
import { matchesShortcut } from './matchesShortcut'
import { normalise, parseSequence, stepsOf } from './parseShortcut'
import type { Combo, ShortcutLayer } from './shortcuts.types'

export type ShortcutHandler = () => unknown

export interface Registration {
  readonly layer: ShortcutLayer
  readonly scope?: ShortcutScope
  readonly mac: boolean
  readonly bindings: () => Readonly<Record<string, ShortcutHandler>>
}

interface Candidate {
  readonly keys: string
  readonly steps: ReadonlyArray<Combo>
  readonly run: ShortcutHandler
  readonly mac: boolean
}

export interface PendingSequence {
  readonly first: string
  readonly next: ReadonlyArray<string>
}

interface Waiting {
  readonly sequence: PendingSequence
  readonly candidates: ReadonlyArray<Candidate>
}

export const sequenceTimeoutMs = 2000

const functionKey = /^f\d+$/
const notHandled = false

const worksWhileTyping = ({ mod, key }: Combo) => mod || key === 'escape' || functionKey.test(key)

const firstStepOf = (keys: string) => normalise(stepsOf(keys)[0] ?? keys)

export const createDispatcher = () => {
  const registrations = new Set<Registration>()
  const watchers = new Set<() => void>()
  let waiting: Waiting | undefined
  let timer: ReturnType<typeof setTimeout> | undefined

  const announce = () => {
    for (const watcher of watchers) watcher()
  }

  const stopWaiting = () => {
    clearTimeout(timer)
    if (waiting === undefined) return
    waiting = undefined
    announce()
  }

  const inLayer = (layer: ShortcutLayer): ReadonlyArray<Candidate> =>
    [...registrations]
      .filter((r) => r.layer === layer)
      .flatMap((r) =>
        Object.entries(r.bindings()).map(([keys, run]) => ({
          keys,
          steps: parseSequence(keys),
          run,
          mac: r.mac,
        })),
      )

  const contentLayer = (): ReadonlyArray<ShortcutLayer> => {
    if (isOverlayOpen()) return ['overlay']
    return isSidebarFocused() ? [] : ['page']
  }

  const active = () => [...contentLayer().flatMap(inLayer), ...inLayer('app')]

  const startWaiting = (event: KeyboardEvent, first: string) => {
    const candidates = active().filter((c) => c.steps.length > 1 && firstStepOf(c.keys) === first)
    event.preventDefault()
    waiting = { sequence: { first, next: candidates.map((c) => normalise(c.keys)) }, candidates }
    timer = setTimeout(stopWaiting, sequenceTimeoutMs)
    announce()
  }

  const finishWaiting = (event: KeyboardEvent, candidates: ReadonlyArray<Candidate>) => {
    stopWaiting()
    event.preventDefault()
    candidates.find((c) => c.steps[1] && matchesShortcut(event, c.steps[1], c.mac))?.run()
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.isComposing || isModifierKey(event.key)) return
    if (event.defaultPrevented) return stopWaiting()
    if (waiting !== undefined) return finishWaiting(event, waiting.candidates)
    for (const candidate of active()) {
      const first = candidate.steps[0]
      if (first === undefined || !matchesShortcut(event, first, candidate.mac)) continue
      if (!worksWhileTyping(first) && isEditable(event.target)) continue
      if (candidate.steps.length > 1) return startWaiting(event, firstStepOf(candidate.keys))
      if (candidate.run() === notHandled) continue
      event.preventDefault()
      return
    }
  }

  return {
    register: (registration: Registration) => {
      if (registrations.size === 0) window.addEventListener('keydown', onKeyDown)
      registrations.add(registration)
      return () => {
        registrations.delete(registration)
        if (registrations.size > 0) return
        window.removeEventListener('keydown', onKeyDown)
        stopWaiting()
      }
    },
    subscribe: (watcher: () => void) => {
      watchers.add(watcher)
      return () => {
        watchers.delete(watcher)
      }
    },
    pending: (): PendingSequence | undefined => waiting?.sequence,
    activeScopes: (): ReadonlySet<ShortcutScope> =>
      new Set([...registrations].flatMap((r) => (r.scope === undefined ? [] : [r.scope]))),
  }
}

export const dispatcher = createDispatcher()
