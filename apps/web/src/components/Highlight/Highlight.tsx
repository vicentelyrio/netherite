import './Highlight.css'

export function Highlight({ text, q }: { readonly text: string; readonly q: string }) {
  const needle = q.trim()
  const at = needle === '' ? -1 : text.toLowerCase().indexOf(needle.toLowerCase())
  if (at < 0) return <>{text}</>
  const end = at + needle.length
  return (
    <>
      {text.slice(0, at)}
      <mark className="highlight">{text.slice(at, end)}</mark>
      {text.slice(end)}
    </>
  )
}
