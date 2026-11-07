import { Card as MantineCard } from '@mantine/core'
import { activateOnKey } from './activateOnKey'
import type { CardProps } from './Card.types'

export function Card({ selected, dropTarget, interactive, onClick, children, ...rest }: CardProps) {
  const clickable = interactive === true || onClick !== undefined
  return (
    <MantineCard
      {...rest}
      data-interactive={clickable || undefined}
      data-selected={selected || undefined}
      data-drop-target={dropTarget || undefined}
      {...(clickable
        ? { tabIndex: 0, role: onClick ? 'button' : 'group', onKeyDown: activateOnKey(onClick) }
        : {})}
      {...(selected === undefined
        ? {}
        : {
            'aria-pressed': onClick ? selected : undefined,
            'aria-current': selected ? 'true' : undefined,
          })}
      onClick={onClick}
    >
      {children}
    </MantineCard>
  )
}
