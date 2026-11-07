import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { renderUi } from '../../../test/helpers'
import { Rail, type RailItem } from './index'

const items: RailItem[] = [
  { id: 'search', label: 'Search', icon: 'search', hint: '⌘K' },
  { id: 'inbox', label: 'Inbox', icon: 'inbox', hint: '⌘I', badge: 3, group: 'work' },
  { id: 'graph', label: 'Graph', icon: 'hub', hint: '⇧⌘G', group: 'work' },
  { id: 'settings', label: 'Settings', icon: 'settings', group: 'work' },
]

describe('Rail', () => {
  test('is a labelled navigation with one button per item', () => {
    renderUi(<Rail items={items} active="inbox" onSelect={() => {}} />)
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(nav).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(4)
  })

  test('marks the active item for assistive tech and for the styles', () => {
    renderUi(<Rail items={items} active="graph" onSelect={() => {}} />)
    const active = screen.getByRole('button', { name: 'Graph' })
    expect(active).toHaveAttribute('aria-current', 'page')
    expect(active).toHaveAttribute('data-active', 'true')
    expect(screen.getByRole('button', { name: 'Search' })).not.toHaveAttribute('aria-current')
  })

  test('selects an item on click', async () => {
    const onSelect = vi.fn()
    renderUi(<Rail items={items} active="inbox" onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: 'Graph' }))
    expect(onSelect).toHaveBeenCalledWith('graph')
  })

  test('works as a controlled component', async () => {
    function Controlled() {
      const [active, setActive] = useState('search')
      return <Rail items={items} active={active} onSelect={setActive} />
    }
    renderUi(<Controlled />)
    expect(screen.getByRole('button', { name: 'Search' })).toHaveAttribute('aria-current', 'page')
    await userEvent.click(screen.getByRole('button', { name: 'Graph' }))
    expect(await screen.findByRole('button', { name: 'Graph' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('button', { name: 'Search' })).not.toHaveAttribute('aria-current')
  })

  test('says which keys each item has', () => {
    renderUi(<Rail items={items} active="inbox" onSelect={() => {}} />)
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
    renderUi(<Rail items={items} active="inbox" onSelect={() => {}} />)
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
      />,
    )
    expect(screen.getByRole('button', { name: 'Inbox, 3 waiting' })).toBeInTheDocument()
    expect(screen.getByText('99+')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'None' })).toBeInTheDocument()
    expect(screen.queryByText('0')).toBeNull()
  })

  test('the arrow keys, Home and End move between items, wrapping round', async () => {
    renderUi(<Rail items={items} active="search" onSelect={() => {}} />)
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
    const { container } = renderUi(<Rail items={items} active="search" onSelect={() => {}} />)
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
      />,
    )
    const groups = [...container.querySelectorAll('.nt-rail-group')]
    expect(groups.map((g) => g.querySelectorAll('button').length)).toEqual([1, 2])
  })

  test('shows the mark at the top and whatever goes at the foot', () => {
    const { container } = renderUi(
      <Rail items={items} active="search" onSelect={() => {}} footer={<span>VL</span>} />,
    )
    expect(container.querySelector('.nt-rail-brand')).toHaveTextContent('N')
    expect(container.querySelector('.nt-rail-footer')).toHaveTextContent('VL')
  })
})
