import { Button, Icon, Menu } from '@netherite/ui'
import { Link } from '@tanstack/react-router'
import { TitleForm } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'
import { type KnowledgeType, useKnowledgeIndex } from '../KnowledgeProvider'
import './KnowledgeActions.css'

const kinds: ReadonlyArray<KnowledgeType> = ['doc', 'adr', 'context', 'runbook']

/** The decision log link and the "New" menu that starts a doc, ADR, context or runbook. */
export function KnowledgeActions() {
  const { LL } = useI18nContext()
  const { startCreating } = useKnowledgeIndex()
  const newLabels = {
    doc: LL.knowledge.actions.newDoc(),
    adr: LL.knowledge.actions.newAdr(),
    context: LL.knowledge.actions.newContext(),
    runbook: LL.knowledge.actions.newRunbook(),
  }
  return (
    <div className="kn-head-actions">
      <Link to="/decisions" className="kn-link-button">
        <Icon name="timeline" size={16} /> {LL.knowledge.actions.decisionLog()}
      </Link>
      <Menu>
        <Menu.Target>
          <Button variant="primary" icon="add">
            {LL.knowledge.actions.new()}
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          {kinds.map((type) => (
            <Menu.Item key={type} onClick={() => startCreating(type)}>
              {newLabels[type]}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    </div>
  )
}

/** Asks for the title of the item being created; nothing while none is. */
export function KnowledgeCreateForm() {
  const { LL } = useI18nContext()
  const { creating, startCreating, create } = useKnowledgeIndex()
  if (creating === undefined) return null
  return (
    <TitleForm
      label={LL.knowledge.actions.titleLabel({ type: creating })}
      onCancel={() => startCreating(undefined)}
      onSubmit={(title) => create(creating, title)}
    />
  )
}
