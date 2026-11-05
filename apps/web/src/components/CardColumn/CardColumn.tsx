import { Grid, Stack } from '@netherite/ui'
import type { ReactNode } from 'react'

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
