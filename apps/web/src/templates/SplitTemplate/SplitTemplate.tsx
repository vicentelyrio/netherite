import { Grid } from '@netherite/ui'
import type { ReactNode } from 'react'
import { SectionName, sectionProps } from '@/infrastructure/sections'
import { PageFrame } from '../PageFrame'
import { PageHeader, PageToolbar } from '../PageHeader'

export interface SplitTemplateProps {
  readonly header: ReactNode
  readonly actions?: ReactNode
  readonly toolbar?: ReactNode
  readonly main: ReactNode
  readonly aside: ReactNode
}

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
        <Grid.Col span={{ base: 12, lg: 8 }} miw={0} {...sectionProps(SectionName.Content)}>
          {main}
        </Grid.Col>
        <Grid.Col
          span={{ base: 12, lg: 4 }}
          miw={0}
          component="aside"
          {...sectionProps(SectionName.Side)}
        >
          {aside}
        </Grid.Col>
      </Grid>
    </PageFrame>
  )
}
