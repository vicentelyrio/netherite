import { Button, Icon, Menu } from '@netherite/ui'
import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useI18nContext } from '@/infrastructure/i18n'
import { useActionShortcuts } from '@/infrastructure/shortcuts'
import type { KnowledgeType } from '../KnowledgeProvider'
import './KnowledgeActions.css'

const kinds: ReadonlyArray<KnowledgeType> = ['doc', 'adr', 'context', 'runbook']

export function KnowledgeActions() {
  const { LL } = useI18nContext()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  useActionShortcuts({ 'knowledge.new': () => setMenuOpen(true) })
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
      <Menu opened={menuOpen} onChange={setMenuOpen}>
        <Menu.Target>
          <Button variant="primary" icon="add">
            {LL.knowledge.actions.new()}
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          {kinds.map((type) => (
            <Menu.Item
              key={type}
              onClick={() => void navigate({ to: '/knowledge/new/$type', params: { type } })}
            >
              {newLabels[type]}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    </div>
  )
}
