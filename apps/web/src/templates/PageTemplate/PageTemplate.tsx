import { Grid } from '@netherite/ui'
import type { ReactNode } from 'react'
import { PageFrame } from '../PageFrame'
import { PageHeader, PageToolbar } from '../PageHeader'

export interface PageTemplateProps {
  /** Breadcrumb, title and subtitle. */
  readonly header: ReactNode
  /** Actions at the right of the header. */
  readonly actions?: ReactNode
  /** Filters and view switches under the header. */
  readonly toolbar?: ReactNode
  /** The page body, across all twelve columns. */
  readonly children: ReactNode
}

/** A page: header with actions, an optional toolbar, then a body over the full grid. */
export function PageTemplate({ header, actions, toolbar, children }: PageTemplateProps) {
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
        <Grid.Col span={12} miw={0}>
          {children}
        </Grid.Col>
      </Grid>
    </PageFrame>
  )
}
