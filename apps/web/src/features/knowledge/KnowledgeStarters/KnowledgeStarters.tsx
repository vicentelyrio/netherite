import { Button, Icon, type ItemTypeName, TypeBadge } from '@netherite/ui'
import { useNotices } from '@/infrastructure/notices'
import { type KnowledgeType, useKnowledgeIndex } from '../KnowledgeProvider'
import './KnowledgeStarters.css'

const importPrompt =
  'Import the Markdown files under docs/ into Netherite. For each file, create a doc with the Netherite MCP `create_item` tool (type doc), keep its text, and set `covers` to the code it describes. Create them in order and lint when done.'

const starters: ReadonlyArray<{ type: ItemTypeName; text: string; path: string }> = [
  {
    type: 'adr',
    text: 'Record a decision with context, the choice and its consequences.',
    path: 'adr/0001-….md',
  },
  {
    type: 'doc',
    text: 'Technical docs and guides that explain how things work.',
    path: 'docs/….md',
  },
  {
    type: 'context',
    text: 'Curated context for AI agents, synced to CLAUDE.md or MCP.',
    path: 'context/….md',
  },
  { type: 'runbook', text: 'Step-by-step operational procedures.', path: 'runbooks/….md' },
]

/** What a repo with no knowledge sees: how to start, and a prompt that imports docs/. */
export function KnowledgeStarters() {
  const { startCreating } = useKnowledgeIndex()
  const notices = useNotices()
  const copy = () => {
    void navigator.clipboard?.writeText(importPrompt).then(() =>
      notices.notify({
        variant: 'success',
        title: 'Prompt copied',
        text: 'Paste it to an agent connected to Netherite to import the files under docs/.',
      }),
    )
  }
  return (
    <div className="kn-empty">
      <div className="kn-empty-icon">
        <Icon name="stacks" size={32} />
      </div>
      <div className="kn-empty-text">
        <h2>No knowledge in this repo yet</h2>
        <p>
          Docs, decisions and agent context are Markdown files with typed frontmatter in{' '}
          <code>knowledge/</code>. They link to your goals, projects and tasks like everything else.
        </p>
      </div>
      <div className="kn-empty-actions">
        <Button variant="primary" icon="add" onClick={() => startCreating('adr')}>
          Record first decision
        </Button>
        <Button icon="drive_file_move" onClick={copy}>
          Import from docs/
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
            <span>{s.text}</span>
            <span className="kn-mono">{s.path}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
