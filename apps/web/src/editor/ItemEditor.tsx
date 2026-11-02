import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { Banner, Button, Icon, SegmentedControl } from '@netherite/ui'
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import { Markdown } from '@/components/Markdown'
import type { LinkTarget } from './complete'
import { counts, type Problem, placeProblems, type ServerDiagnostic } from './diagnostics'
import { hasChanges } from './diff'
import { changesField, editorExtensions, setHead, setProblems } from './extensions'
import { isDirty, reduce, startSession, type Version } from './session'

export type EditorMode = 'split' | 'text'

export interface ItemEditorProps {
  /** The file as the server has it now. When it changes while the buffer is being edited, the person is asked. */
  readonly source: Version & { readonly head: string | null }
  /** Saves the whole text over the version it was based on. Resolves when it is on disk; rejects if it was refused. */
  readonly onSave: (text: string, baseHash: string) => Promise<Version>
  /** Asks the server about text that is not saved. */
  readonly lint: (text: string) => Promise<ReadonlyArray<ServerDiagnostic>>
  /** Items a `[[` can link to. */
  readonly targets: ReadonlyArray<LinkTarget>
  readonly mode?: EditorMode
  readonly onModeChange?: (mode: EditorMode) => void
  /** Called with the view once it exists, for tests and tools. */
  readonly onReady?: (view: EditorView) => void
  /** `drawer` fills its frame with no margins or borders of its own. */
  readonly variant?: 'page' | 'drawer'
  /** What to show beside the code instead of the rendered text. */
  readonly preview?: ReactNode
  /** Told how many lines differ from the last commit, as the buffer changes. */
  readonly onStats?: (stats: { readonly changedLines: number }) => void
  /** The checked-out branch, shown in the status bar. */
  readonly branch?: string | undefined
}

/** The text after the frontmatter, which is what the rendered view shows. */
export const bodyOf = (text: string) => text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')

const lintDelay = 400

/**
 * The source editor for one item (TASK-00036): CodeMirror with YAML frontmatter and Markdown,
 * problems from the server's lint, wikilink completion, a gutter of changes since the last commit,
 * and the rendered text beside it. If the file changes on disk while there are unsaved edits, it
 * says so and lets the person choose; it never overwrites either side by itself.
 */
export function ItemEditor({
  source,
  onSave,
  lint,
  targets,
  mode: controlled,
  onModeChange,
  onReady,
  variant = 'page',
  preview,
  onStats,
  branch,
}: ItemEditorProps) {
  const host = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const [session, dispatch] = useReducer(
    reduce,
    { text: source.text, hash: source.hash },
    startSession,
  )
  const [problems, setProblemsState] = useState<ReadonlyArray<Problem>>([])
  const [position, setPosition] = useState({ line: 1, column: 1 })
  const [changed, setChanged] = useState(false)
  const [changedLines, setChangedLines] = useState(0)
  const [saving, setSaving] = useState(false)
  const [localMode, setLocalMode] = useState<EditorMode>('split')
  const mode = controlled ?? localMode

  // Callbacks and lists the editor reads at the moment it needs them.
  const latest = useRef({ session, onSave, lint, targets })
  latest.current = { session, onSave, lint, targets }
  const sessionRef = latest

  // 1. The file changed on disk.
  const lastSource = useRef(source)
  useEffect(() => {
    if (lastSource.current === source) return
    lastSource.current = source
    dispatch({ type: 'remote', version: { text: source.text, hash: source.hash } })
  }, [source])

  // 2. Save.
  const save = useCallback(async () => {
    const { session: current, onSave: write } = latest.current
    if (!isDirty(current) || saving) return
    setSaving(true)
    try {
      dispatch({ type: 'saved', version: await write(current.buffer, current.base.hash) })
    } catch {
      // The caller says why (a conflict, an invalid file); the buffer stays as it is.
    } finally {
      setSaving(false)
    }
  }, [saving])
  const saveRef = useRef(save)
  saveRef.current = save

  // 3. Linting what is typed, a moment after the typing stops.
  const lintTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lintGeneration = useRef(0)
  const runLint = useCallback((view: EditorView) => {
    const text = view.state.doc.toString()
    const generation = ++lintGeneration.current
    latest.current.lint(text).then(
      (found) => {
        // An answer for text that has since changed is not placed.
        if (generation !== lintGeneration.current || viewRef.current !== view) return
        const placed = placeProblems(text, found)
        view.dispatch({ effects: setProblems.of(placed) })
        setProblemsState(placed)
      },
      () => {},
    )
  }, [])

  // 4. The editor itself.
  const extensions = useMemo(
    () => [
      ...editorExtensions({
        onSave: () => void saveRef.current(),
        targets: () => latest.current.targets,
      }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          dispatch({ type: 'edit', text: update.state.doc.toString() })
          clearTimeout(lintTimer.current)
          lintTimer.current = setTimeout(() => runLint(update.view), lintDelay)
        }
        if (update.docChanged || update.selectionSet) {
          const head = update.state.selection.main.head
          const line = update.state.doc.lineAt(head)
          setPosition({ line: line.number, column: head - line.from + 1 })
        }
        const lines = update.state.field(changesField)
        setChanged(hasChanges(lines))
        setChangedLines(lines.added.size + lines.modified.size + lines.deleted.size)
      }),
    ],
    [runLint],
  )

  useEffect(() => {
    if (mode === 'text' || host.current === null) return
    const view = new EditorView({
      parent: host.current,
      state: EditorState.create({ doc: sessionRef.current.session.buffer, extensions }),
    })
    viewRef.current = view
    view.dispatch({ effects: setHead.of(source.head) })
    runLint(view)
    onReady?.(view)
    return () => {
      clearTimeout(lintTimer.current)
      view.destroy()
      if (viewRef.current === view) viewRef.current = null
    }
    // The view is made once per mode switch; later changes reach it through the effects below.
  }, [mode, extensions, runLint])

  // The committed version can change (a commit was made) without the buffer changing.
  useEffect(() => {
    viewRef.current?.dispatch({ effects: setHead.of(source.head) })
  }, [source.head])

  // When the session replaces the buffer (reload, a silent follow), the editor takes it.
  useEffect(() => {
    const view = viewRef.current
    if (view === null) return
    const doc = view.state.doc.toString()
    if (doc !== session.buffer) {
      view.dispatch({ changes: { from: 0, to: doc.length, insert: session.buffer } })
    }
  }, [session.buffer])

  const statsRef = useRef(onStats)
  statsRef.current = onStats
  useEffect(() => statsRef.current?.({ changedLines }), [changedLines])

  const { errors, warnings } = counts(problems)
  const dirty = isDirty(session)

  return (
    <section className="ed" data-mode={mode} data-variant={variant} aria-label="Source editor">
      {session.conflict !== undefined && (
        <div className="ed-conflict">
          <Banner
            variant="danger"
            title="Changed on disk"
            actions={
              <>
                <Button onClick={() => dispatch({ type: 'reload' })}>
                  Reload (lose my changes)
                </Button>
                <Button onClick={() => dispatch({ type: 'keep-mine' })}>Keep mine</Button>
              </>
            }
          >
            This file changed while you were editing it. Reloading takes the new version and drops
            your edits; keeping yours means your next save replaces the new version.
          </Banner>
        </div>
      )}
      <div className="ed-panes">
        {mode === 'split' && <div className="ed-code" ref={host} data-testid="editor" />}
        <div className="ed-rendered">{preview ?? <Markdown source={bodyOf(session.buffer)} />}</div>
      </div>
      <footer className="ed-status">
        <span className="ed-count" data-kind="error" title={`${errors} errors`}>
          <Icon name="error" size={15} />
          {errors}
        </span>
        <span
          className="ed-count"
          data-kind="warning"
          data-on={warnings > 0 || undefined}
          title={`${warnings} warnings`}
        >
          <Icon name="warning" size={15} filled={warnings > 0} />
          {warnings}
        </span>
        <span className="ed-divider" aria-hidden="true" />
        <span className="ed-position">
          Ln {position.line}, Col {position.column}
        </span>
        <span className="app-muted">Markdown · YAML</span>
        {changed && <span className="ed-changed">Changed since the last commit</span>}
        <span className="ed-spacer" />
        {branch !== undefined && (
          <span className="ed-branch">
            <Icon name="commit" size={15} /> {branch}
          </span>
        )}
        {dirty && <span className="ed-dirty">Unsaved</span>}
        <Button
          icon="save"
          loading={saving}
          disabled={!dirty || session.conflict !== undefined}
          onClick={() => void save()}
        >
          Save
        </Button>
        <SegmentedControl
          value={mode}
          onChange={(value) => (onModeChange ?? setLocalMode)(value as EditorMode)}
          data={[
            { value: 'split', label: 'code' },
            { value: 'text', label: 'text' },
          ]}
          aria-label="View"
        />
      </footer>
    </section>
  )
}
