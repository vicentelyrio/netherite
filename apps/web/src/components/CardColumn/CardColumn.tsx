import { Grid, Stack } from '@netherite/ui'
import type { ReactNode, Ref } from 'react'

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
    <Grid.Col
      span={{ base: 12, lg: 4 }}
      miw={0}
      {...(rootRef === undefined ? {} : { ref: rootRef })}
      data-over={over || undefined}
    >
      <Stack gap="md" {...(label ? { role: 'region', 'aria-label': label } : {})}>
        {children}
      </Stack>
    </Grid.Col>
  )
}
