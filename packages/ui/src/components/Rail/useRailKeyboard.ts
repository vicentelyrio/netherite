import { type KeyboardEvent, type RefObject, useCallback } from 'react'

const navigationKeys = new Set(['ArrowDown', 'ArrowUp', 'Home', 'End'])

const nextIndex = (key: string, at: number, length: number) => {
  if (key === 'Home') return 0
  if (key === 'End') return length - 1
  return (at + (key === 'ArrowDown' ? 1 : -1) + length) % length
}

export const useRailKeyboard = (list: RefObject<HTMLDivElement | null>) =>
  useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (!navigationKeys.has(event.key)) return
      const buttons = [...(list.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])]
      if (buttons.length === 0) return
      const at = buttons.indexOf(document.activeElement as HTMLButtonElement)
      event.preventDefault()
      buttons[nextIndex(event.key, at, buttons.length)]?.focus()
    },
    [list],
  )
