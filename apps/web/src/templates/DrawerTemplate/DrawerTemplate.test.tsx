import { NetheriteProvider } from '@netherite/ui'
import { render as plain, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, test } from 'vitest'
import { DrawerTemplate } from './DrawerTemplate'

const render = (ui: ReactElement) => plain(<NetheriteProvider env="test">{ui}</NetheriteProvider>)

describe('DrawerTemplate', () => {
  test('DrawerTemplate shows the pane only when given one', () => {
    const { rerender } = render(
      <DrawerTemplate header="top" pane={<p>code</p>} footer="bar">
        text
      </DrawerTemplate>,
    )
    expect(screen.getByText('code')).toBeTruthy()
    expect(screen.getByText('bar')).toBeTruthy()
    rerender(
      <NetheriteProvider env="test">
        <DrawerTemplate header="top">text</DrawerTemplate>
      </NetheriteProvider>,
    )
    expect(screen.queryByText('code')).toBeNull()
    expect(document.querySelector('.tpl-drawer-footer')).toBeNull()
  })
})
