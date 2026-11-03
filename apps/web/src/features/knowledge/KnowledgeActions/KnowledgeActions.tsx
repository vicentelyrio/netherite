import { Button, Icon, Menu } from '@netherite/ui'
import { Link } from '@tanstack/react-router'
import { TitleForm } from '@/components'
import { type KnowledgeType, useKnowledgeIndex } from '../KnowledgeProvider'
import './KnowledgeActions.css'

const kinds: ReadonlyArray<readonly [KnowledgeType, string]> = [
  ['doc', 'New doc'],
  ['adr', 'New ADR'],
  ['context', 'New context'],
  ['runbook', 'New runbook'],
]

/** The decision log link and the "New" menu that starts a doc, ADR, context or runbook. */
export function KnowledgeActions() {
  const { startCreating } = useKnowledgeIndex()
  return (
    <div className="kn-head-actions">
      <Link to="/decisions" className="kn-link-button">
        <Icon name="timeline" size={16} /> Decision log
      </Link>
      <Menu>
        <Menu.Target>
          <Button variant="primary" icon="add">
            New
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          {kinds.map(([type, label]) => (
            <Menu.Item key={type} onClick={() => startCreating(type)}>
              {label}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    </div>
  )
}

/** Asks for the title of the item being created; nothing while none is. */
export function KnowledgeCreateForm() {
  const { creating, startCreating, create } = useKnowledgeIndex()
  if (creating === undefined) return null
  return (
    <TitleForm
      label={`New ${creating} title`}
      onCancel={() => startCreating(undefined)}
      onSubmit={(title) => create(creating, title)}
    />
  )
}
