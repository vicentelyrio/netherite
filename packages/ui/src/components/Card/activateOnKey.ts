import type { KeyboardEvent } from 'react'

const activationKeys = new Set(['Enter', ' '])

export const activateOnKey =
  (onClick: (() => void) | undefined) => (event: KeyboardEvent<HTMLDivElement>) => {
    if (onClick !== undefined && activationKeys.has(event.key)) {
      event.preventDefault()
      onClick()
    }
  }
