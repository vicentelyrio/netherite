import { Stack } from '@netherite/ui'
import type { ReactNode, Ref } from 'react'
import './CardColumn.css'

export function CardColumn({
  children,
  label,
  rootRef,
  over,
}: {
  readonly children: ReactNode
  readonly label?: string
  readonly rootRef?: Ref<HTMLDivElement>
  readonly over?: boolean
}) {
  return (
    <div
      className="card-column"
      {...(rootRef === undefined ? {} : { ref: rootRef })}
      data-over={over || undefined}
    >
      <Stack gap="md" {...(label ? { role: 'region', 'aria-label': label } : {})}>
        {children}
      </Stack>
    </div>
  )
}
