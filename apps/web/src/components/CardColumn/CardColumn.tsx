import { Grid, Stack } from '@netherite/ui'
import type { ReactNode } from 'react'

/** One column of cards in a card grid: four of the twelve columns, the full width when narrow. */
export function CardColumn({
  children,
  label,
}: {
  readonly children: ReactNode
  readonly label?: string
}) {
  return (
    <Grid.Col span={{ base: 12, lg: 4 }} miw={0}>
      <Stack gap="md" {...(label ? { role: 'region', 'aria-label': label } : {})}>
        {children}
      </Stack>
    </Grid.Col>
  )
}
