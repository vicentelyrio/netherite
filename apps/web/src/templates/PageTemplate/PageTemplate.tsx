import { Grid } from '@netherite/ui'
import type { ReactNode } from 'react'
import { SectionName, sectionProps } from '@/infrastructure/sections'
import { PageFrame } from '../PageFrame'
import { PageHeader, PageToolbar } from '../PageHeader'

export interface PageTemplateProps {
  readonly header: ReactNode
  readonly actions?: ReactNode
  readonly toolbar?: ReactNode
  readonly children: ReactNode
}

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
        <Grid.Col span={12} miw={0} {...sectionProps(SectionName.Content)}>
          {children}
        </Grid.Col>
      </Grid>
    </PageFrame>
  )
}
