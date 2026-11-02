import { Grid } from '@netherite/ui'
import type { ReactNode } from 'react'
import { PageFrame } from '../PageFrame'

export interface CardGridTemplateProps {
  /** Breadcrumb and title above the columns. */
  readonly header: ReactNode
  /** The columns: `CardColumn`s, each four of the twelve columns. */
  readonly children: ReactNode
}

/** Equal columns of cards (Goals: one column per area). Stacks on narrow screens. */
export function CardGridTemplate({ header, children }: CardGridTemplateProps) {
  return (
    <PageFrame>
      <Grid>
        <Grid.Col span={12}>
          <header>{header}</header>
        </Grid.Col>
        {children}
      </Grid>
    </PageFrame>
  )
}
