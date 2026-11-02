import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { Rail, type RailItem } from '../src/index'
import { renderUi } from './helpers'

const items: RailItem[] = [
  { id: 'search', label: 'Search', icon: 'search', shortcut: 'mod+k' },
  { id: 'inbox', label: 'Inbox', icon: 'inbox', shortcut: 'mod+i', badge: 3, group: 'work' },
  { id: 'graph', label: 'Graph', icon: 'hub', shortcut: 'mod+shift+g', group: 'work' },
  { id: 'settings', label: 'Settings', icon: 'settings', group: 'work' },
]

describe('Rail', () => {
  test('is a labelled navigation with one button per item', () => {
    renderUi(<Rail items={items} active="inbox" onSelect={() => {}} mac />)
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(nav).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(4)
  })

  test('marks the active item for assistive tech and for the styles', () => {
    renderUi(<Rail items={items} active="graph" onSelect={() => {}} mac />)
    const active = screen.getByRole('button', { name: 'Graph' })
    expect(active).toHaveAttribute('aria-current', 'page')
    expect(active).toHaveAttribute('data-active', 'true')
    expect(screen.getByRole('button', { name: 'Search' })).not.toHaveAttribute('aria-current')
  })

  test('selects an item on click', async () => {
    const onSelect = vi.fn()
    renderUi(<Rail items={items} active="inbox" onSelect={onSelect} mac />)
    await userEvent.click(screen.getByRole('button', { name: 'Graph' }))
    expect(onSelect).toHaveBeenCalledWith('graph')
  })

  test('shortcuts select items from anywhere, including ones with shift', () => {
    const onSelect = vi.fn()
    renderUi(<Rail items={items} active="inbox" onSelect={onSelect} mac />)
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    fireEvent.keyDown(window, { key: 'g', metaKey: true, shiftKey: true })
    fireEvent.keyDown(window, { key: 'i', metaKey: true })
    expect(onSelect.mock.calls).toEqual([['search'], ['graph'], ['inbox']])
  })

  test('on other platforms the shortcut is Control', () => {
    const onSelect = vi.fn()
    renderUi(<Rail items={items} active="inbox" onSelect={onSelect} mac={false} />)
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(onSelect).not.toHaveBeenCalled()
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    expect(onSelect).toHaveBeenCalledWith('search')
  })

  test('shortcuts can be turned off, and then only clicks select', () => {
    const onSelect = vi.fn()
    renderUi(<Rail items={items} active="inbox" onSelect={onSelect} shortcuts={false} mac />)
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(onSelect).not.toHaveBeenCalled()
  })

  test('works as a controlled component', async () => {
    function Controlled() {
      const [active, setActive] = useState('search')
      return <Rail items={items} active={active} onSelect={setActive} mac />
    }
    renderUi(<Controlled />)
    expect(screen.getByRole('button', { name: 'Search' })).toHaveAttribute('aria-current', 'page')
    fireEvent.keyDown(window, { key: 'g', metaKey: true, shiftKey: true })
    expect(await screen.findByRole('button', { name: 'Graph' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('button', { name: 'Search' })).not.toHaveAttribute('aria-current')
  })

  test('says which shortcut each item has, in the platform’s notation', () => {
    renderUi(<Rail items={items} active="inbox" onSelect={() => {}} mac />)
    expect(screen.getByRole('button', { name: 'Search' })).toHaveAttribute(
      'aria-keyshortcuts',
      '⌘K',
    )
    expect(screen.getByRole('button', { name: 'Graph' })).toHaveAttribute(
      'aria-keyshortcuts',
      '⇧⌘G',
    )
    expect(screen.getByRole('button', { name: 'Settings' })).not.toHaveAttribute(
      'aria-keyshortcuts',
    )
  })

  test('shows the label and shortcut in a tooltip', async () => {
    renderUi(<Rail items={items} active="inbox" onSelect={() => {}} mac />)
    await userEvent.hover(screen.getByRole('button', { name: 'Graph' }))
    const tip = await screen.findByRole('tooltip')
    expect(tip).toHaveTextContent('Graph')
    expect(tip).toHaveTextContent('⇧⌘G')
  })

  test('a badge adds to the name, caps at 99+, and is hidden at 0', () => {
    renderUi(
      <Rail
        items={[
          { id: 'a', label: 'Inbox', icon: 'inbox', badge: 3 },
          { id: 'b', label: 'Big', icon: 'inbox', badge: 250 },
          { id: 'c', label: 'None', icon: 'inbox', badge: 0 },
        ]}
        active="a"
        onSelect={() => {}}
        mac
      />,
    )
    expect(screen.getByRole('button', { name: 'Inbox, 3 waiting' })).toBeInTheDocument()
    expect(screen.getByText('99+')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'None' })).toBeInTheDocument()
    expect(screen.queryByText('0')).toBeNull()
  })

  test('the arrow keys, Home and End move between items, wrapping round', async () => {
    renderUi(<Rail items={items} active="search" onSelect={() => {}} mac />)
    const names = () => (document.activeElement as HTMLElement).getAttribute('aria-label')
    screen.getByRole('button', { name: 'Search' }).focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(names()).toBe('Inbox, 3 waiting')
    await userEvent.keyboard('{End}')
    expect(names()).toBe('Settings')
    await userEvent.keyboard('{ArrowDown}')
    expect(names()).toBe('Search')
    await userEvent.keyboard('{ArrowUp}')
    expect(names()).toBe('Settings')
    await userEvent.keyboard('{Home}')
    expect(names()).toBe('Search')
  })

  test('items that share a group sit on one ground, and an item with no group stands alone', () => {
    const { container } = renderUi(<Rail items={items} active="search" onSelect={() => {}} mac />)
    const groups = container.querySelectorAll('.nt-rail-group')
    expect(groups).toHaveLength(1)
    expect(
      [...(groups[0]?.querySelectorAll('button') ?? [])].map((b) => b.getAttribute('aria-label')),
    ).toEqual(['Inbox, 3 waiting', 'Graph', 'Settings'])
    const top = container.querySelector('.nt-rail-top') as HTMLElement
    expect(top.querySelectorAll('button')).toHaveLength(1)
    expect(top.querySelector('button')).toHaveAttribute('aria-label', 'Search')
  })

  test('separate runs of the same group name stay separate, and each group has its own ground', () => {
    const { container } = renderUi(
      <Rail
        items={[
          { id: 'a', label: 'A', icon: 'a', group: 'one' },
          { id: 'b', label: 'B', icon: 'b', group: 'two' },
          { id: 'c', label: 'C', icon: 'c', group: 'two' },
        ]}
        active="a"
        onSelect={() => {}}
        mac
      />,
    )
    const groups = [...container.querySelectorAll('.nt-rail-group')]
    expect(groups.map((g) => g.querySelectorAll('button').length)).toEqual([1, 2])
  })

  test('shows the mark at the top and whatever goes at the foot', () => {
    const { container } = renderUi(
      <Rail items={items} active="search" onSelect={() => {}} footer={<span>VL</span>} mac />,
    )
    expect(container.querySelector('.nt-rail-brand')).toHaveTextContent('N')
    expect(container.querySelector('.nt-rail-footer')).toHaveTextContent('VL')
  })
})
