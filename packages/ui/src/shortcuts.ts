import { useEffect, useRef } from 'react'

export interface Combo {
  readonly mod: boolean
  readonly shift: boolean
  readonly alt: boolean
  readonly key: string
}

export const parseShortcut = (shortcut: string): Combo => {
  const parts = shortcut
    .toLowerCase()
    .split('+')
    .map((p) => p.trim())
    .filter((p) => p !== '')
  const key = parts.at(-1)
  if (key === undefined) throw new Error(`Empty shortcut: "${shortcut}"`)
  const modifiers = new Set(parts.slice(0, -1))
  for (const m of modifiers) {
    if (m !== 'mod' && m !== 'shift' && m !== 'alt')
      throw new Error(`Unknown modifier "${m}" in "${shortcut}"`)
  }
  return {
    mod: modifiers.has('mod'),
    shift: modifiers.has('shift'),
    alt: modifiers.has('alt'),
    key,
  }
}

export const isMacPlatform = () => {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
  return /mac|iphone|ipad/i.test(nav.userAgentData?.platform ?? navigator.platform ?? '')
}

const keyNames: Record<string, string> = {
  enter: '↵',
  escape: 'Esc',
  arrowup: '↑',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
  ' ': 'Space',
}

export const formatShortcut = (shortcut: string, mac = isMacPlatform()) => {
  const combo = parseShortcut(shortcut)
  const key = keyNames[combo.key] ?? combo.key.toUpperCase()
  if (mac) return `${combo.alt ? '⌥' : ''}${combo.shift ? '⇧' : ''}${combo.mod ? '⌘' : ''}${key}`
  return [combo.mod ? 'Ctrl' : '', combo.alt ? 'Alt' : '', combo.shift ? 'Shift' : '', key]
    .filter(Boolean)
    .join('+')
}

type KeyEventLike = Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'>

export const matchesShortcut = (event: KeyEventLike, combo: Combo, mac = isMacPlatform()) => {
  const mod = mac ? event.metaKey : event.ctrlKey
  const stray = mac ? event.ctrlKey : event.metaKey
  return (
    event.key.toLowerCase() === combo.key &&
    mod === combo.mod &&
    !stray &&
    event.shiftKey === combo.shift &&
    event.altKey === combo.alt
  )
}

const isEditable = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  )
}

export interface ShortcutOptions {
  readonly enabled?: boolean
  readonly mac?: boolean
}

export function useShortcuts(
  bindings: Readonly<Record<string, () => void>>,
  options: ShortcutOptions = {},
) {
  const latest = useRef(bindings)
  latest.current = bindings
  const enabled = options.enabled ?? true

  useEffect(() => {
    if (!enabled) return
    const mac = options.mac ?? isMacPlatform()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return
      for (const [shortcut, handler] of Object.entries(latest.current)) {
        const combo = parseShortcut(shortcut)
        if (!combo.mod && isEditable(event.target)) continue
        if (matchesShortcut(event, combo, mac)) {
          event.preventDefault()
          handler()
          return
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled, options.mac])
}
