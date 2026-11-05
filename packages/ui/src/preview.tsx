import { Group, Stack } from '@mantine/core'
import { adrStatuses, itemTypeNames, type StateCategory } from '@netherite/tokens'
import { type ReactNode, useState } from 'react'
import { ActionIcon, Avatar, Button, Card, Progress, ProgressRing } from './components/controls'
import {
  Banner,
  EmptyState,
  FreshnessLabel,
  OrphanTag,
  StatusPill,
  TypeBadge,
} from './components/domain'
import {
  Chip,
  Drawer,
  Menu,
  Modal,
  SegmentedControl,
  Switch,
  Tabs,
  Tooltip,
} from './components/pickers'
import { Icon } from './icon'
import { Rail, type RailItem } from './rail'

const railItems: ReadonlyArray<RailItem> = [
  { id: 'search', label: 'Search', icon: 'search', shortcut: 'mod+k' },
  { id: 'inbox', label: 'Inbox', icon: 'inbox', shortcut: 'mod+i', badge: 3, group: 'inbox' },
  { id: 'goals', label: 'Goals', icon: 'track_changes', shortcut: 'mod+g', group: 'work' },
  { id: 'projects', label: 'Projects', icon: 'task_alt', shortcut: 'mod+p', group: 'work' },
  { id: 'knowledge', label: 'Knowledge', icon: 'stacks', shortcut: 'mod+l', group: 'work' },
  { id: 'stats', label: 'Stats', icon: 'bar_chart', shortcut: 'mod+d', group: 'insight' },
  { id: 'tags', label: 'Tags', icon: 'sell', shortcut: 'mod+t', group: 'insight' },
  { id: 'graph', label: 'Graph', icon: 'hub', shortcut: 'mod+shift+g', group: 'insight' },
]

const states: ReadonlyArray<[string, StateCategory]> = [
  ['backlog', 'todo'],
  ['in progress', 'active'],
  ['on hold', 'blocked'],
  ['done', 'done'],
]

function Section({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <section className="nt-preview-section">
      <h2 className="nt-overline nt-preview-title">{title}</h2>
      {children}
    </section>
  )
}

/**
 * Every component in every state, on one page. The app shows it at `/dev/ui`; it is how the
 * design is checked by eye, and how a change to a token or a style is seen everywhere at once.
 */
export function UiPreview() {
  const [active, setActive] = useState('goals')
  const [selected, setSelected] = useState('b')
  const [modal, setModal] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [chips, setChips] = useState({ stale: true, orphans: false })
  const [switched, setSwitched] = useState(true)
  const [banner, setBanner] = useState(true)

  return (
    <div className="nt-preview">
      <div className="nt-preview-rail">
        <Rail
          items={railItems}
          active={active}
          onSelect={setActive}
          footer={<Avatar name="vicentelyrio" size={32} color="warning" />}
        />
      </div>
      <main className="nt-preview-main">
        <header className="nt-preview-header">
          <h1 className="nt-preview-h1">Netherite components</h1>
          <span className="nt-preview-note">The Netherite Refined design, dark only</span>
        </header>

        <Section title="Item types · badge and graph shape">
          <Group gap="lg">
            {itemTypeNames.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
          </Group>
          <Group gap="lg">
            {itemTypeNames.map((type) => (
              <TypeBadge key={type} type={type} glyphOnly />
            ))}
            <TypeBadge type="adr" hollow />
          </Group>
        </Section>

        <Section title="Status">
          <Group gap="sm">
            {adrStatuses.map((status) => (
              <StatusPill key={status} kind="adr" status={status} />
            ))}
          </Group>
          <Group gap="sm">
            {states.map(([state, category]) => (
              <StatusPill key={state} kind="state" state={state} category={category} />
            ))}
          </Group>
          <Group gap="sm">
            <FreshnessLabel state="fresh" />
            <FreshnessLabel state="drifting" commits={3} since="2026-01-15" />
            <FreshnessLabel state="stale" commits={12} />
            <FreshnessLabel state="stale" commits={10} atLeast />
            <FreshnessLabel state="unknown" />
            <OrphanTag />
          </Group>
        </Section>

        <Section title="Buttons">
          <Group gap="sm">
            <Button variant="primary" icon="add">
              New task
            </Button>
            <Button>Secondary</Button>
            <Button variant="subtle" icon="edit">
              Subtle
            </Button>
            <Button variant="danger" icon="delete">
              Delete
            </Button>
            <Button loading>Saving</Button>
            <Button disabled>Disabled</Button>
          </Group>
          <Group gap="xs">
            <ActionIcon icon="search" label="Search" />
            <ActionIcon icon="filter_list" label="Filter" active />
            <ActionIcon icon="more_horiz" label="More" />
            <ActionIcon icon="close" label="Close" disabled />
          </Group>
        </Section>

        <Section title="Chips, avatars, switch">
          <Group gap="sm">
            <Chip checked={chips.stale} onChange={(stale) => setChips({ ...chips, stale })}>
              Stale
            </Chip>
            <Chip checked={chips.orphans} onChange={(orphans) => setChips({ ...chips, orphans })}>
              Orphans
            </Chip>
            <Avatar name="@ada" />
            <Avatar name="Grace Hopper" />
            <Avatar name="@vicentelyrio" size="md" />
            <SegmentedControl
              data={[
                { value: 'code', label: 'code' },
                { value: 'text', label: 'text' },
              ]}
              defaultValue="code"
            />
            <Switch
              checked={switched}
              onChange={(e) => setSwitched(e.currentTarget.checked)}
              label="Include in context"
            />
          </Group>
        </Section>

        <Section title="Cards">
          <div className="nt-preview-cards">
            <Card>
              <CardBody id="TASK-00042" title="Plain card" />
            </Card>
            <Card interactive>
              <CardBody id="TASK-00043" title="Hover me" />
            </Card>
            {['a', 'b'].map((id) => (
              <Card key={id} selected={selected === id} onClick={() => setSelected(id)}>
                <CardBody
                  id={`TASK-0004${id === 'a' ? 4 : 5}`}
                  title={selected === id ? 'Selected card' : 'Click to select'}
                />
              </Card>
            ))}
            <Card dropTarget>
              <CardBody id="TASK-00046" title="Drop target" />
            </Card>
          </div>
        </Section>

        <Section title="Progress">
          <Stack gap="xs" maw={320}>
            <Progress done={3} total={8} />
            <Progress done={8} total={8} />
          </Stack>
          <Group gap="md">
            <ProgressRing done={3} total={8} />
            <ProgressRing done={8} total={8} />
            <ProgressRing done={5} total={12} size={56} showCount />
          </Group>
        </Section>

        <Section title="Tabs, menu, tooltip">
          <Tabs defaultValue="tasks">
            <Tabs.List>
              <Tabs.Tab value="tasks">Tasks</Tabs.Tab>
              <Tabs.Tab value="docs">Docs</Tabs.Tab>
              <Tabs.Tab value="knowledge">Knowledge</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="tasks">Tasks board goes here.</Tabs.Panel>
            <Tabs.Panel value="docs">Docs and runbooks.</Tabs.Panel>
            <Tabs.Panel value="knowledge">Everything linked to the project.</Tabs.Panel>
          </Tabs>
          <Group gap="sm">
            <Menu>
              <Menu.Target>
                <Button icon="expand_more">Menu</Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Item</Menu.Label>
                <Menu.Item leftSection={<Icon name="edit" />}>Rename</Menu.Item>
                <Menu.Item leftSection={<Icon name="link" />}>Copy ID</Menu.Item>
                <Menu.Divider />
                <Menu.Item color="danger" leftSection={<Icon name="delete" />}>
                  Delete
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
            <Tooltip label="Opens after a short pause" position="bottom">
              <Button variant="subtle">Hover for a tooltip</Button>
            </Tooltip>
            <Button onClick={() => setModal(true)}>Open modal</Button>
            <Button onClick={() => setDrawer(true)}>Open drawer</Button>
          </Group>
        </Section>

        <Section title="Banners">
          <Stack gap="xs">
            {banner && (
              <Banner
                variant="warning"
                title="This doc may be out of date"
                actions={<Button size="sm">Mark reviewed</Button>}
                onClose={() => setBanner(false)}
              >
                12 commits touched the files it covers since 2026-01-15.
              </Banner>
            )}
            <Banner variant="info" title="Superseded">
              Replaced by ADR-00019.
            </Banner>
            <Banner variant="success" title="Saved">
              Nothing was committed.
            </Banner>
            <Banner
              variant="danger"
              title="Changed on disk"
              actions={<Button size="sm">Reload</Button>}
            >
              The file changed while you were editing it.
            </Banner>
          </Stack>
        </Section>

        <Section title="Empty state">
          <EmptyState
            icon="menu_book"
            title="No knowledge yet"
            description="Docs, ADRs and context you add show up here, with what they cover and who links to them."
            actions={
              <>
                <Button variant="primary" icon="add">
                  New doc
                </Button>
                <Button icon="gavel">New ADR</Button>
              </>
            }
          />
        </Section>
      </main>

      <Modal opened={modal} onClose={() => setModal(false)} title="Delete TASK-00042?">
        Other items link to it. Deleting it leaves those links broken.
        <Group justify="flex-end" mt="md">
          <Button onClick={() => setModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => setModal(false)}>
            Delete anyway
          </Button>
        </Group>
      </Modal>
      <Drawer opened={drawer} onClose={() => setDrawer(false)} title="TASK-00042">
        The task drawer shows the fields, the checklist and the related items.
      </Drawer>
    </div>
  )
}

function CardBody({ id, title }: { readonly id: string; readonly title: string }) {
  return (
    <Stack gap={6}>
      <Group justify="space-between" gap="xs">
        <TypeBadge type="task" />
        <code className="nt-preview-id">{id}</code>
      </Group>
      <div>{title}</div>
      <Progress done={2} total={5} />
    </Stack>
  )
}
