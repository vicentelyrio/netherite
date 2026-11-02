import { NetheriteProvider } from '@netherite/ui'
import { render as plain } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, test } from 'vitest'
import { CardGridTemplate } from './CardGridTemplate'

const render = (ui: ReactElement) => plain(<NetheriteProvider env="test">{ui}</NetheriteProvider>)

describe('CardGridTemplate', () => {
  test('CardGridTemplate gives each column node its own column', () => {
    render(
      <CardGridTemplate
        header="h"
        columns={[<p key="a">a</p>, <p key="b">b</p>, <p key="c">c</p>]}
      />,
    )
    expect(document.querySelectorAll('.tpl-cards-column')).toHaveLength(3)
  })
})
