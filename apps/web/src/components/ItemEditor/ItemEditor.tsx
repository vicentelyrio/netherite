import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { settingDefaults } from '@netherite/schema'
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Markdown } from '@/components/Markdown'
import { useI18nContext } from '@/infrastructure/i18n'
import { bodyOf } from './bodyOf'
import { counts, type Problem, placeProblems } from './diagnostics'
import { hasChanges } from './diff'
import { EditorConflict } from './EditorConflict'
import { EditorStatus } from './EditorStatus'
import { changesField, editorExtensions, setHead, setProblems } from './extensions'
import type { EditorMode, ItemEditorProps } from './ItemEditor.types'
import { isDirty, reduce, startSession } from './session'
import './ItemEditor.css'

const { autosaveDelayMs, lintDelayMs: lintDelay } = settingDefaults.editor

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
  autosaveDelay = autosaveDelayMs,
  saveKeys = 'mod+s',
  vimMode = false,
  dark = true,
}: ItemEditorProps) {
  const { LL } = useI18nContext()
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

  const latest = useRef({ session, onSave, lint, targets })
  latest.current = { session, onSave, lint, targets }
  const sessionRef = latest

  const lastSource = useRef(source)
  useEffect(() => {
    if (lastSource.current === source) return
    lastSource.current = source
    dispatch({ type: 'remote', version: { text: source.text, hash: source.hash } })
  }, [source])

  const save = useCallback(async () => {
    const { session: current, onSave: write } = latest.current
    if (!isDirty(current) || saving) return
    setSaving(true)
    try {
      dispatch({ type: 'saved', version: await write(current.buffer, current.base.hash) })
    } catch {
      refused.current = current.buffer
    } finally {
      setSaving(false)
    }
  }, [saving])
  const saveRef = useRef(save)
  saveRef.current = save
  const refused = useRef<string | undefined>(undefined)
  const linted = useRef<{ text: string; errors: number } | undefined>(undefined)

  const lintTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lintGeneration = useRef(0)
  const runLint = useCallback((view: EditorView) => {
    const text = view.state.doc.toString()
    const generation = ++lintGeneration.current
    latest.current.lint(text).then(
      (found) => {
        if (generation !== lintGeneration.current || viewRef.current !== view) return
        const placed = placeProblems(text, found)
        linted.current = { text, errors: counts(placed).errors }
        view.dispatch({ effects: setProblems.of(placed) })
        setProblemsState(placed)
      },
      () => {},
    )
  }, [])

  const extensions = useMemo(
    () => [
      ...editorExtensions({
        onSave: () => void saveRef.current(),
        targets: () => latest.current.targets,
        saveKeys,
        vimMode,
        dark,
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
    [runLint, saveKeys, vimMode, dark],
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
  }, [mode, extensions, runLint])

  useEffect(() => {
    viewRef.current?.dispatch({ effects: setHead.of(source.head) })
  }, [source.head])

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

  const buffer = session.buffer
  const conflicted = session.conflict !== undefined
  useEffect(() => {
    if (!dirty || conflicted || saving || refused.current === buffer) return
    const timer = setTimeout(() => {
      const judged = linted.current
      if (judged?.text === buffer && judged.errors === 0) void saveRef.current()
    }, autosaveDelay)
    return () => clearTimeout(timer)
  }, [buffer, dirty, conflicted, saving, autosaveDelay, problems])

  return (
    <section
      className="ed"
      data-mode={mode}
      data-variant={variant}
      aria-label={LL.components.editor.label()}
    >
      {session.conflict !== undefined && (
        <EditorConflict
          onReload={() => dispatch({ type: 'reload' })}
          onKeepMine={() => dispatch({ type: 'keep-mine' })}
        />
      )}
      <div className="ed-panes">
        {mode === 'split' && <div className="ed-code" ref={host} data-testid="editor" />}
        <div className="ed-rendered">{preview ?? <Markdown source={bodyOf(session.buffer)} />}</div>
      </div>
      <EditorStatus
        errors={errors}
        warnings={warnings}
        position={position}
        changed={changed}
        branch={branch}
        saving={saving}
        dirty={dirty}
        mode={mode}
        onMode={onModeChange ?? setLocalMode}
      />
    </section>
  )
}
