import { renderMarkdown } from './renderMarkdown'
import './Markdown.css'

export function Markdown({
  source,
  className,
}: {
  readonly source: string
  readonly className?: string
}) {
  return <div className={className ? `md ${className}` : 'md'}>{renderMarkdown(source)}</div>
}
