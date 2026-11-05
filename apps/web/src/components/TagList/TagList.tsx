import './TagList.css'

export interface TagListProps {
  readonly tags: ReadonlyArray<string>
}

/** Tags as small chips; nothing when there are none. */
export function TagList({ tags }: TagListProps) {
  if (tags.length === 0) return null
  return (
    <div className="tag-list">
      {tags.map((tag) => (
        <span key={tag} className="tag-list-item">
          {tag}
        </span>
      ))}
    </div>
  )
}
