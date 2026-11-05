import { Grid } from '@netherite/ui'
import type { ReactNode } from 'react'
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
          <header>{header}</header>
        </Grid.Col>
        {children}
      </Grid>
    </PageFrame>
  )
}
