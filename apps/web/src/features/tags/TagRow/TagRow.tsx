import type { TagUse } from '@netherite/api'
import { Button, Icon, type ItemTypeName, TypeGlyph } from '@netherite/ui'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { TagList } from '@/components'
import { RenameForm } from '../RenameForm'
import './TagRow.css'

/** One tag: its name, kind, how many items of each type carry it, and rename and expand. */
export function TagRow({
  tag,
  tags,
}: {
  readonly tag: TagUse
  readonly tags: ReadonlyArray<TagUse>
}) {
  const [open, setOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  return (
    <div className="tg-row-wrap">
      <div className="tg-row">
        <button
          type="button"
          className="tg-name"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <Icon name={open ? 'expand_more' : 'chevron_right'} size={16} />
          <TagList tags={[tag.name]} />
        </button>
        <span className="tg-field">{tag.field === 'tags' ? 'tag' : 'label'}</span>
        <span className="tg-types">
          {Object.entries(tag.byType)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([type, n]) => (
              <span key={type} className="tg-type" title={`${n} ${type}`}>
                <TypeGlyph type={type as ItemTypeName} /> {n}
              </span>
            ))}
        </span>
        <strong className="tg-total">{tag.total}</strong>
        <Button size="sm" icon="edit" onClick={() => setRenaming(!renaming)}>
          Rename
        </Button>
      </div>
      {renaming && <RenameForm tag={tag} tags={tags} onDone={() => setRenaming(false)} />}
      {open && (
        <ul className="tg-items" aria-label={`Items with ${tag.name}`}>
          {tag.ids.map((id) => (
            <li key={id}>
              <Link to="/items/$id" params={{ id }}>
                {id}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
