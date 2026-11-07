import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import { renderUi } from '../../../test/helpers'
import { Button } from '../Button'
import { Menu } from './index'

describe('Menu', () => {
  test('Menu opens on click and runs an item', async () => {
    const onRename = vi.fn()
    renderUi(
      <Menu>
        <Menu.Target>
          <Button>Menu</Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item onClick={onRename}>Rename</Menu.Item>
        </Menu.Dropdown>
      </Menu>,
    )
    expect(screen.queryByRole('menuitem')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Menu' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Rename' }))
    expect(onRename).toHaveBeenCalled()
  })
})
