import { Grid, Stack } from '@netherite/ui'
import type { ReactNode } from 'react'
import { PageFrame } from '../PageFrame'

export interface CardGridTemplateProps {
  /** Breadcrumb and title above the columns. */
  readonly header: ReactNode
  /** One node per column; each takes four of the twelve columns. */
  readonly columns: ReadonlyArray<ReactNode>
}

/** Equal columns of cards (Goals: one column per area). Stacks on narrow screens. */
export function CardGridTemplate({ header, columns }: CardGridTemplateProps) {
  return (
    <PageFrame>
      <Grid>
        <Grid.Col span={12}>
          <header>{header}</header>
        </Grid.Col>
        {columns.map((column, index) => (
          // The columns are fixed by the caller and never reorder, so the index is a stable key.
          <Grid.Col key={index} span={{ base: 12, lg: 4 }} miw={0}>
            <Stack gap="md" className="tpl-cards-column">
              {column}
            </Stack>
          </Grid.Col>
        ))}
      </Grid>
    </PageFrame>
  )
}
