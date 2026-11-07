import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import { renderUi } from '../../../test/helpers'
import { Tabs } from './index'

describe('Tabs', () => {
  test('Tabs show one panel at a time and move with the arrow keys', async () => {
    renderUi(
      <Tabs defaultValue="a">
        <Tabs.List>
          <Tabs.Tab value="a">One</Tabs.Tab>
          <Tabs.Tab value="b">Two</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="a">panel a</Tabs.Panel>
        <Tabs.Panel value="b">panel b</Tabs.Panel>
      </Tabs>,
    )
    expect(screen.getByText('panel a')).toBeVisible()
    expect(screen.queryByText('panel b')).toBeNull()
    screen.getByRole('tab', { name: 'One' }).focus()
    await userEvent.keyboard('{ArrowRight}{Enter}')
    expect(screen.getByText('panel b')).toBeVisible()
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveClass('nt-tab')
  })
})
