import type { ItemDetail, ItemSummary } from '@netherite/api'
import { Button, Icon, Menu } from '@netherite/ui'
import { Link } from '@tanstack/react-router'
import { useI18nContext } from '@/infrastructure/i18n'
import './TaskDecisions.css'
import '../shared.css'

export function TaskDecisions({
  decisions,
  choices,
  onLink,
}: {
  readonly decisions: ItemDetail['links']
  readonly choices: ReadonlyArray<ItemSummary>
  readonly onLink: (adrId: string) => void
}) {
  const { LL } = useI18nContext()
  return (
    <section className="drawer-row" aria-label={LL.tasks.decisions.title()}>
      <span className="drawer-cell-label">{LL.tasks.decisions.title()}</span>
      <div className="drawer-decisions">
        {decisions.map((d) => (
          <Link key={d.id} to="/items/$id" params={{ id: d.id as string }} className="drawer-adr">
            <Icon name="diamond" size={14} />
            <span className="drawer-adr-id">{d.id}</span> {d.title}
          </Link>
        ))}
        {decisions.length === 0 && <span className="app-muted">{LL.tasks.decisions.none()}</span>}
        <Menu>
          <Menu.Target>
            <Button size="sm" icon="add" disabled={choices.length === 0}>
              {LL.tasks.decisions.link()}
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            {choices.map((a) => (
              <Menu.Item key={a.id} onClick={() => onLink(a.id)}>
                {a.id} {a.title}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      </div>
    </section>
  )
}
