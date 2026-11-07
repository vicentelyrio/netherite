import './CoChangedFile.css'

export function CoChangedFile({
  file,
}: {
  readonly file: { readonly path: string; readonly share: number; readonly commits: number }
}) {
  return (
    <div className="kn-file-row">
      <span className="kn-mono kn-file-path">{file.path}</span>
      <span className="kn-bar-mini">
        <span style={{ width: `${Math.round(file.share * 100)}%` }} />
      </span>
      <span className="app-muted">{file.commits}</span>
    </div>
  )
}
