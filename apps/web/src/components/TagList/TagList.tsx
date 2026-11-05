import './TagList.css'

export interface TagListProps {
  readonly tags: ReadonlyArray<string>
}

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
