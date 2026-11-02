import { adrStatuses, itemTypeNames } from '@netherite/tokens'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import {
  ActionIcon,
  Avatar,
  avatarColorOf,
  Banner,
  Button,
  Card,
  Drawer,
  EmptyState,
  FreshnessLabel,
  Icon,
  initialsOf,
  Menu,
  Modal,
  Progress,
  ProgressRing,
  percentOf,
  StatusPill,
  Switch,
  Tabs,
  TypeBadge,
  typeLabels,
} from '../src/index'
import { renderUi } from './helpers'

describe('Icon', () => {
  test('is hidden from screen readers unless it has a label', () => {
    const { container } = renderUi(<Icon name="check" />)
    const icon = container.querySelector('.nt-icon')
    expect(icon).toHaveTextContent('check')
    expect(icon).toHaveAttribute('aria-hidden', 'true')
    renderUi(<Icon name="warning" label="Warning" />)
    expect(screen.getByRole('img', { name: 'Warning' })).toBeInTheDocument()
  })

  test('sizes and strokes are the design’s: rail 22 at 300, switcher 20 at 300, inline 16 at 400, pill 14 at 500', () => {
    const { container } = renderUi(
      <div>
        <Icon name="a" size="rail" />
        <Icon name="b" size="switcher" />
        <Icon name="c" />
        <Icon name="d" size="pill" />
        <Icon name="e" size={13} weight={500} filled />
      </div>,
    )
    const icons = [...container.querySelectorAll<HTMLElement>('.nt-icon')]
    expect(icons.map((e) => e.style.fontSize)).toEqual(['22px', '20px', '16px', '14px', '13px'])
    expect(icons.map((e) => e.style.fontVariationSettings)).toEqual([
      "'FILL' 0, 'wght' 300",
      "'FILL' 0, 'wght' 300",
      "'FILL' 0, 'wght' 400",
      "'FILL' 0, 'wght' 500",
      "'FILL' 1, 'wght' 500",
    ])
  })
})

describe('Button', () => {
  test('fires on click and shows its icon before the label', async () => {
    const onClick = vi.fn()
    renderUi(
      <Button icon="add" onClick={onClick}>
        New task
      </Button>,
    )
    const button = screen.getByRole('button', { name: /New task/ })
    expect(within(button).getByText('add')).toBeInTheDocument()
    await userEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('has the four looks, and the theme’s classes', () => {
    renderUi(
      <>
        <Button variant="primary">p</Button>
        <Button>s</Button>
        <Button variant="subtle">u</Button>
        <Button variant="danger">d</Button>
      </>,
    )
    const variants = screen.getAllByRole('button').map((b) => b.getAttribute('data-variant'))
    expect(variants).toEqual(['filled', 'default', 'subtle', 'filled'])
    for (const b of screen.getAllByRole('button')) expect(b).toHaveClass('nt-button')
  })

  test('does not fire when disabled or loading', async () => {
    const onClick = vi.fn()
    renderUi(
      <>
        <Button disabled onClick={onClick}>
          off
        </Button>
        <Button loading onClick={onClick}>
          busy
        </Button>
      </>,
    )
    for (const b of screen.getAllByRole('button')) await userEvent.click(b)
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('ActionIcon', () => {
  test('is named by its label, so a screen reader can say what it does', () => {
    renderUi(<ActionIcon icon="search" label="Search" />)
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument()
  })

  test('shows its label as a tooltip on hover', async () => {
    renderUi(<ActionIcon icon="search" label="Search" />)
    await userEvent.hover(screen.getByRole('button', { name: 'Search' }))
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Search')
  })

  test('says whether it is on', () => {
    renderUi(<ActionIcon icon="filter_list" label="Filter" active tooltip={false} />)
    expect(screen.getByRole('button', { name: 'Filter' })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('Avatar', () => {
  test('takes initials from a name or a handle', () => {
    expect(initialsOf('Grace Hopper')).toBe('GH')
    expect(initialsOf('@ada')).toBe('AD')
    expect(initialsOf('@vicente.lyrio')).toBe('VL')
    expect(initialsOf('x')).toBe('X')
    expect(initialsOf('')).toBe('')
  })

  test('the same person always has the same colour', () => {
    expect(avatarColorOf('@ada')).toBe(avatarColorOf('@ADA'))
    const colors = new Set(
      ['@ada', '@grace', '@linus', '@margaret', '@ken', '@barbara'].map(avatarColorOf),
    )
    expect(colors.size).toBeGreaterThan(1)
  })

  test('shows initials, and the full name on hover', () => {
    renderUi(<Avatar name="Grace Hopper" />)
    expect(screen.getByText('GH')).toBeInTheDocument()
    expect(screen.getAllByTitle('Grace Hopper').length).toBeGreaterThan(0)
  })
})

describe('Card', () => {
  test('a plain card is not a control', () => {
    const { container } = renderUi(<Card>content</Card>)
    const card = container.querySelector('.nt-card') as HTMLElement
    expect(card).not.toHaveAttribute('tabindex')
    expect(card).not.toHaveAttribute('data-interactive')
  })

  test('a clickable card can be reached and used with the keyboard', async () => {
    const onClick = vi.fn()
    renderUi(<Card onClick={onClick}>open</Card>)
    const card = screen.getByRole('button', { name: 'open' })
    expect(card).toHaveAttribute('tabindex', '0')
    await userEvent.click(card)
    card.focus()
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(3)
  })

  test('selected and drop-target states are marked for the styles and for assistive tech', () => {
    const { container } = renderUi(
      <>
        <Card selected onClick={() => {}}>
          a
        </Card>
        <Card dropTarget>b</Card>
      </>,
    )
    const [selected, target] = [...container.querySelectorAll('.nt-card')]
    expect(selected).toHaveAttribute('data-selected', 'true')
    expect(selected).toHaveAttribute('aria-pressed', 'true')
    expect(target).toHaveAttribute('data-drop-target', 'true')
    expect(target).not.toHaveAttribute('data-selected')
  })
})

describe('Progress', () => {
  test('counts the share done, and a checklist with nothing in it as nothing done', () => {
    expect(percentOf(3, 8)).toBe(38)
    expect(percentOf(8, 8)).toBe(100)
    expect(percentOf(0, 0)).toBe(0)
    expect(percentOf(9, 8)).toBe(100)
    expect(percentOf(-1, 8)).toBe(0)
  })

  test('the bar and the ring say how much is done, in words', () => {
    renderUi(
      <>
        <Progress done={3} total={8} label="Checklist" />
        <ProgressRing done={5} total={12} label="Project" showCount />
      </>,
    )
    expect(screen.getByLabelText('Checklist: 3 of 8 done')).toBeInTheDocument()
    expect(screen.getByLabelText('Project: 5 of 12 done')).toBeInTheDocument()
    expect(screen.getByText('5/12')).toBeInTheDocument()
  })

  test('the ring shows a percentage by default', () => {
    renderUi(<ProgressRing done={3} total={8} />)
    expect(screen.getByText('38%')).toBeInTheDocument()
  })
})

describe('TypeBadge', () => {
  test('names every type, with its colour on the label and the glyph', () => {
    const { container } = renderUi(
      <div>
        {itemTypeNames.map((t) => (
          <TypeBadge key={t} type={t} />
        ))}
      </div>,
    )
    for (const type of itemTypeNames) expect(screen.getByText(typeLabels[type])).toBeInTheDocument()
    const badges = [...container.querySelectorAll<HTMLElement>('.nt-type-badge')]
    expect(badges.map((b) => b.getAttribute('style'))).toEqual(
      itemTypeNames.map((t) => `--nt-badge-color: var(--nt-color-type-${t});`),
    )
    const glyphs = [...container.querySelectorAll<HTMLElement>('.nt-type-glyph')]
    expect(new Set(glyphs.map((g) => g.style.background)).size).toBe(itemTypeNames.length)
  })

  test('the knowledge types are drawn as the design draws them', () => {
    const { container } = renderUi(
      <div>
        <TypeBadge type="adr" />
        <TypeBadge type="doc" />
        <TypeBadge type="context" />
        <TypeBadge type="runbook" />
      </div>,
    )
    const [adr, doc, context, runbook] = [
      ...container.querySelectorAll<HTMLElement>('.nt-type-glyph'),
    ]
    expect([adr?.style.width, adr?.style.transform, adr?.style.borderRadius]).toEqual([
      '6px',
      'rotate(45deg)',
      '2px',
    ])
    expect([doc?.style.width, doc?.style.borderRadius]).toEqual(['7px', '3px'])
    expect([context?.style.width, context?.style.borderRadius]).toEqual(['8px', '50%'])
    expect(context?.style.border).toContain('1.5px solid')
    expect([runbook?.style.width, runbook?.style.height]).toEqual(['9px', '5px'])
  })

  test('a superseded ADR is a hollow diamond', () => {
    const { container } = renderUi(<TypeBadge type="adr" hollow />)
    const glyph = container.querySelector<HTMLElement>('.nt-type-glyph')
    expect(glyph?.style.background).toBe('transparent')
    expect(glyph?.style.border).toContain('1.5px solid')
  })

  test('shape-only keeps the name for screen readers', () => {
    renderUi(<TypeBadge type="adr" glyphOnly />)
    expect(screen.getByText('ADR')).toHaveClass('nt-visually-hidden')
  })
})

describe('StatusPill and FreshnessLabel', () => {
  test('an ADR status and a task state read as words', () => {
    renderUi(
      <>
        {adrStatuses.map((status) => (
          <StatusPill key={status} kind="adr" status={status} />
        ))}
        <StatusPill kind="state" state="in review" category="active" />
      </>,
    )
    for (const word of ['Proposed', 'Accepted', 'Deprecated', 'Superseded', 'In review']) {
      expect(screen.getByText(word)).toBeInTheDocument()
    }
    expect(screen.getByText('In review')).toHaveAttribute('data-value', 'active')
  })

  test('the colour comes from the matching token', () => {
    renderUi(<StatusPill kind="adr" status="accepted" />)
    expect(screen.getByText('Accepted').getAttribute('style')).toContain(
      'var(--nt-color-adr-accepted)',
    )
  })

  test('freshness says how far a doc has drifted', () => {
    renderUi(
      <>
        <FreshnessLabel state="fresh" />
        <FreshnessLabel state="drifting" commits={1} />
        <FreshnessLabel state="drifting" commits={3} />
        <FreshnessLabel state="stale" commits={10} atLeast />
        <FreshnessLabel state="unknown" />
      </>,
    )
    expect(screen.getByText('Fresh')).toBeInTheDocument()
    expect(screen.getByText('Drifting · 1 commit')).toBeInTheDocument()
    expect(screen.getByText('Drifting · 3 commits')).toBeInTheDocument()
    expect(screen.getByText('Stale · 10+ commits')).toBeInTheDocument()
    expect(screen.getByText('Not tracked')).toBeInTheDocument()
  })

  test('the tooltip says since when', () => {
    const { container } = renderUi(<FreshnessLabel state="stale" commits={12} since="2026-01-15" />)
    expect(container.querySelector('.nt-freshness')).toHaveAttribute(
      'title',
      '12 commits to covered files since 2026-01-15',
    )
  })
})

describe('Banner and EmptyState', () => {
  test('problems interrupt screen readers; other messages wait', () => {
    renderUi(
      <>
        <Banner variant="danger" title="d" />
        <Banner variant="warning" title="w" />
        <Banner variant="info" title="i" />
        <Banner variant="success" title="s" />
      </>,
    )
    expect(screen.getAllByRole('alert')).toHaveLength(2)
    expect(screen.getAllByRole('status')).toHaveLength(2)
  })

  test('shows its title, text and actions, and can be dismissed', async () => {
    const onClose = vi.fn()
    renderUi(
      <Banner title="Out of date" actions={<Button>Review</Button>} onClose={onClose}>
        12 commits since review.
      </Banner>,
    )
    expect(screen.getByText('Out of date')).toBeInTheDocument()
    expect(screen.getByText('12 commits since review.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Review' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(onClose).toHaveBeenCalled()
  })

  test('has no close button unless it can close', () => {
    renderUi(<Banner title="x" />)
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull()
  })

  test('an empty state says what is missing and offers a way forward', async () => {
    const onClick = vi.fn()
    renderUi(
      <EmptyState
        title="No knowledge yet"
        description="Add a doc."
        actions={<Button onClick={onClick}>New doc</Button>}
      />,
    )
    expect(screen.getByRole('heading', { name: 'No knowledge yet' })).toBeInTheDocument()
    expect(screen.getByText('Add a doc.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'New doc' }))
    expect(onClick).toHaveBeenCalled()
  })
})

describe('library components with the theme applied', () => {
  test('Switch toggles and is named by its label', async () => {
    const onChange = vi.fn()
    renderUi(<Switch label="Include in context" onChange={onChange} />)
    await userEvent.click(screen.getByRole('switch', { name: 'Include in context' }))
    expect(onChange).toHaveBeenCalled()
  })

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

  test('Modal and Drawer show their title and content when open, and close with Escape', async () => {
    const onClose = vi.fn()
    renderUi(
      <>
        <Modal opened onClose={onClose} title="Delete TASK-00042?">
          modal text
        </Modal>
        <Drawer opened onClose={onClose} title="TASK-00042">
          drawer text
        </Drawer>
      </>,
    )
    expect(await screen.findByText('modal text')).toBeInTheDocument()
    expect(screen.getByText('drawer text')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Delete TASK-00042?' })).toBeInTheDocument()
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  test('Modal and Drawer are absent while closed', () => {
    renderUi(
      <Modal opened={false} onClose={() => {}} title="x">
        hidden
      </Modal>,
    )
    expect(screen.queryByText('hidden')).toBeNull()
  })
})

describe('icons before the font arrives', () => {
  test('the provider marks the page when icons can be shown, so names never flash as text', async () => {
    document.documentElement.removeAttribute('data-nt-icons')
    renderUi(<Icon name="check" />)
    await waitFor(() => expect(document.documentElement).toHaveAttribute('data-nt-icons', 'ready'))
  })
})
