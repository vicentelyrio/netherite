import { Progress } from '@netherite/ui'

/** The progress bar with its count, `18/24`, at the end; green when everything is done. */
export function Bar({
  done,
  total,
  label,
}: {
  readonly done: number
  readonly total: number
  readonly label?: string
}) {
  return (
    <div className="goal-bar">
      <Progress done={done} total={total} {...(label ? { label } : {})} />
      <span className="goal-bar-count" data-done={(total > 0 && done === total) || undefined}>
        {done}/{total}
      </span>
    </div>
  )
}

/** Tags as small chips. */
export function Tags({ tags }: { readonly tags: ReadonlyArray<string> }) {
  if (tags.length === 0) return null
  return (
    <div className="goal-tags">
      {tags.map((tag) => (
        <span key={tag} className="goal-tag">
          {tag}
        </span>
      ))}
    </div>
  )
}
