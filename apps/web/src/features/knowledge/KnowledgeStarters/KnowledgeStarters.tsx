import { Button, Icon, type ItemTypeName, TypeBadge } from '@netherite/ui'
import { useI18nContext } from '@/infrastructure/i18n'
import { useNotices } from '@/infrastructure/notices'
import { type KnowledgeType, useKnowledgeIndex } from '../KnowledgeProvider'
import './KnowledgeStarters.css'

const starters: ReadonlyArray<{ type: ItemTypeName; path: string }> = [
  { type: 'adr', path: 'adr/0001-….md' },
  { type: 'doc', path: 'docs/….md' },
  { type: 'context', path: 'context/….md' },
  { type: 'runbook', path: 'runbooks/….md' },
]

export function KnowledgeStarters() {
  const { LL } = useI18nContext()
  const { startCreating } = useKnowledgeIndex()
  const notices = useNotices()
  const copy = () => {
    void navigator.clipboard?.writeText(LL.knowledge.starters.importPrompt()).then(() =>
      notices.notify({
        variant: 'success',
        title: LL.knowledge.starters.copied(),
        text: LL.knowledge.starters.copiedText(),
      }),
    )
  }
  return (
    <div className="kn-empty">
      <div className="kn-empty-icon">
        <Icon name="stacks" size={32} />
      </div>
      <div className="kn-empty-text">
        <h2>{LL.knowledge.starters.title()}</h2>
        <p>{LL.knowledge.starters.text({ folder: 'knowledge/' })}</p>
      </div>
      <div className="kn-empty-actions">
        <Button variant="primary" icon="add" onClick={() => startCreating('adr')}>
          {LL.knowledge.starters.recordFirst()}
        </Button>
        <Button icon="drive_file_move" onClick={copy}>
          {LL.knowledge.starters.importDocs()}
        </Button>
      </div>
      <div className="kn-starters">
        {starters.map((s) => (
          // biome-ignore lint/a11y/useSemanticElements: a card with a badge and text, not a plain button
          <div
            key={s.type}
            className="kn-starter"
            role="button"
            tabIndex={0}
            onClick={() => startCreating(s.type as KnowledgeType)}
            onKeyDown={(e) => e.key === 'Enter' && startCreating(s.type as KnowledgeType)}
          >
            <TypeBadge type={s.type} />
            <span>{LL.knowledge.starters[s.type as KnowledgeType]()}</span>
            <span className="kn-mono">{s.path}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
