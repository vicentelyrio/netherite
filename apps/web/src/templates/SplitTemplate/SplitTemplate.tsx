import { Grid } from '@netherite/ui'
import type { ReactNode } from 'react'
import { PageFrame } from '../PageFrame'
import { PageHeader, PageToolbar } from '../PageHeader'

export interface SplitTemplateProps {
  readonly header: ReactNode
  readonly actions?: ReactNode
  readonly toolbar?: ReactNode
  /** The list or canvas: eight columns. */
  readonly main: ReactNode
  /** The preview or detail panel: four columns, beside the main area. */
  readonly aside: ReactNode
}

/** A list with a detail panel beside it (Knowledge, Tags, Inbox). Stacks on narrow screens. */
export function SplitTemplate({ header, actions, toolbar, main, aside }: SplitTemplateProps) {
  return (
    <PageFrame>
      <Grid>
        <Grid.Col span={12}>
          <PageHeader actions={actions}>{header}</PageHeader>
        </Grid.Col>
        {toolbar && (
          <Grid.Col span={12}>
            <PageToolbar>{toolbar}</PageToolbar>
          </Grid.Col>
        )}
        <Grid.Col span={{ base: 12, lg: 8 }} miw={0}>
          {main}
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 4 }} miw={0} component="aside">
          {aside}
        </Grid.Col>
      </Grid>
    </PageFrame>
  )
}
