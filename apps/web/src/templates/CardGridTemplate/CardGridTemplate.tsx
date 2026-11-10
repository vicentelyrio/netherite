import { Grid } from '@netherite/ui'
import type { ReactNode } from 'react'
import { SectionName, sectionProps } from '@/infrastructure/sections'
import { PageFrame } from '../PageFrame'

export interface CardGridTemplateProps {
  readonly header: ReactNode
  readonly children: ReactNode
}

export function CardGridTemplate({ header, children }: CardGridTemplateProps) {
  return (
    <PageFrame>
      <Grid>
        <Grid.Col span={12}>
          <header {...sectionProps(SectionName.Header)}>{header}</header>
        </Grid.Col>
        <Grid.Col span={12} miw={0} {...sectionProps(SectionName.Content)}>
          <Grid>{children}</Grid>
        </Grid.Col>
      </Grid>
    </PageFrame>
  )
}
