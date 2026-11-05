import {
  autocompletion,
  type Completion,
  type CompletionContext,
  completionKeymap,
} from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { yamlFrontmatter } from '@codemirror/lang-yaml'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { type Extension, RangeSetBuilder, StateEffect, StateField } from '@codemirror/state'
import {
  Decoration,
  type DecorationSet,
  drawSelection,
  EditorView,
  GutterMarker,
  gutter,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  MatchDecorator,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from '@codemirror/view'
import { tags as t } from '@lezer/highlight'
import { type LinkTarget, linkOptions, openWikiLink } from './complete'
import type { Problem } from './diagnostics'
import { diffLines, type LineChanges, noChanges } from './diff'

export const setHead = StateEffect.define<string | null>()

export const setProblems = StateEffect.define<ReadonlyArray<Problem>>()

const headField = StateField.define<string | null>({
  create: () => null,
  update: (value, tr) => {
    for (const e of tr.effects) if (e.is(setHead)) return e.value
    return value
  },
})

export const changesField = StateField.define<LineChanges>({
  create: () => noChanges,
  update: (value, tr) => {
    const headChanged = tr.effects.some((e) => e.is(setHead))
    if (!tr.docChanged && !headChanged) return value
    const head = tr.state.field(headField)
    return head === null ? noChanges : diffLines(head, tr.state.doc.toString())
  },
})

export const problemsField = StateField.define<ReadonlyArray<Problem>>({
  create: () => [],
  update: (value, tr) => {
    for (const e of tr.effects) if (e.is(setProblems)) return e.value
    if (!tr.docChanged) return value
    return value.flatMap((p) => {
      const from = tr.changes.mapPos(p.from, 1)
      const to = tr.changes.mapPos(p.to, -1)
      return to > from ? [{ ...p, from, to, line: tr.state.doc.lineAt(from).number }] : []
    })
  },
})

class DiffMark extends GutterMarker {
  constructor(readonly kind: 'added' | 'modified' | 'deleted') {
    super()
  }
  override eq(other: DiffMark) {
    return other.kind === this.kind
  }
  override toDOM() {
    const el = document.createElement('div')
    el.className = `cm-diff-mark cm-diff-${this.kind}`
    el.title = { added: 'Added', modified: 'Modified (uncommitted)', deleted: 'Deleted below' }[
      this.kind
    ]
    return el
  }
}
const marks = {
  added: new DiffMark('added'),
  modified: new DiffMark('modified'),
  deleted: new DiffMark('deleted'),
}

const diffGutter = gutter({
  class: 'cm-diff-gutter',
  lineMarker: (view, line) => {
    const changes = view.state.field(changesField)
    const n = view.state.doc.lineAt(line.from).number
    if (changes.added.has(n)) return marks.added
    if (changes.modified.has(n)) return marks.modified
    if (changes.deleted.has(n)) return marks.deleted
    return null
  },
  lineMarkerChange: (update) =>
    update.docChanged || update.startState.field(changesField) !== update.state.field(changesField),
  initialSpacer: () => marks.added,
})

class WarningMark extends GutterMarker {
  constructor(
    readonly severity: 'error' | 'warning',
    readonly message: string,
  ) {
    super()
  }
  override eq(other: WarningMark) {
    return other.severity === this.severity && other.message === this.message
  }
  override toDOM() {
    const el = document.createElement('span')
    el.className = `cm-lint-mark cm-lint-${this.severity} nt-icon`
    el.textContent = this.severity === 'error' ? 'error' : 'warning'
    el.title = this.message
    el.style.fontVariationSettings = "'FILL' 1, 'wght' 400"
    return el
  }
}

class LintSpacer extends GutterMarker {
  override toDOM() {
    const el = document.createElement('span')
    el.className = 'cm-lint-spacer'
    return el
  }
}

const lintGutter = gutter({
  class: 'cm-lint-gutter',
  lineMarker: (view, line) => {
    const n = view.state.doc.lineAt(line.from).number
    const here = view.state.field(problemsField).filter((p) => p.line === n)
    const worst = here.find((p) => p.severity === 'error') ?? here[0]
    return worst ? new WarningMark(worst.severity, worst.message) : null
  },
  lineMarkerChange: (update) =>
    update.docChanged ||
    update.startState.field(problemsField) !== update.state.field(problemsField),
  initialSpacer: () => new LintSpacer(),
})

const mark = (className: string) => Decoration.mark({ class: className })

const matcher = (regexp: RegExp, className: string) => {
  const decorator = new MatchDecorator({ regexp, decoration: () => mark(className) })
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet
      constructor(view: EditorView) {
        this.decorations = decorator.createDeco(view)
      }
      update(update: ViewUpdate) {
        this.decorations = decorator.updateDeco(update, this.decorations)
      }
    },
    { decorations: (v) => v.decorations },
  )
}

export const wikiLinks = matcher(/\[\[[^\]\n]+\]\]/g, 'cm-wikilink')
export const dates = matcher(
  /\b\d{4}-\d{2}-\d{2}(?:T[\d:.]+(?:Z|[+-]\d{2}:?\d{2})?)?\b/g,
  'cm-date',
)
export const mentions = matcher(/(?<![\w@])@[\w-]+/g, 'cm-mention')
export const checks = matcher(/(?<=^\s*[-*+] )\[[ xX]\]/gm, 'cm-check')

class Hint extends WidgetType {
  constructor(readonly text: string) {
    super()
  }
  override eq(other: Hint) {
    return other.text === this.text
  }
  override toDOM() {
    const el = document.createElement('span')
    el.className = 'cm-hint'
    el.textContent = this.text
    return el
  }
  override ignoreEvent() {
    return true
  }
}

const problemDecorations = EditorView.decorations.compute([problemsField], (state) => {
  const builder = new RangeSetBuilder<Decoration>()
  const items: Array<{ from: number; to: number; deco: Decoration }> = []
  const hinted = new Set<number>()
  for (const p of state.field(problemsField)) {
    if (p.from >= state.doc.length + 1) continue
    const to = Math.min(p.to, state.doc.length)
    const from = Math.min(p.from, to)
    if (to > from) items.push({ from, to, deco: mark(`cm-problem cm-problem-${p.severity}`) })
    const line = state.doc.lineAt(Math.min(p.from, state.doc.length))
    if (!hinted.has(line.number)) {
      hinted.add(line.number)
      items.push({
        from: line.to,
        to: line.to,
        deco: Decoration.widget({ widget: new Hint(p.message), side: 1 }),
      })
    }
  }
  items.sort((a, b) => a.from - b.from || a.to - b.to)
  for (const i of items) builder.add(i.from, i.to, i.deco)
  return builder.finish()
})

export const wikiCompletion = (targets: () => ReadonlyArray<LinkTarget>): Extension =>
  autocompletion({
    icons: false,
    override: [
      (context: CompletionContext) => {
        const line = context.state.doc.lineAt(context.pos)
        const before = line.text.slice(0, context.pos - line.from)
        const open = openWikiLink.exec(before)
        if (open === null) return null
        const options: Completion[] = linkOptions(targets(), open[1] ?? '').map((o) => ({
          label: o.label,
          detail: o.detail,
          type: o.type,
          apply: o.apply,
        }))
        return { from: context.pos - (open[1]?.length ?? 0), options, filter: false }
      },
    ],
  })

const v = (name: string) => `var(--nt-color-${name})`

export const highlight = HighlightStyle.define([
  { tag: [t.propertyName, t.definition(t.propertyName)], color: v('syntax-key') },
  { tag: [t.string, t.special(t.string)], color: v('syntax-string') },
  {
    tag: [
      t.punctuation,
      t.separator,
      t.bracket,
      t.meta,
      t.processingInstruction,
      t.contentSeparator,
    ],
    color: v('syntax-punct'),
  },
  {
    tag: [t.heading, t.heading1, t.heading2, t.heading3, t.heading4],
    color: v('text-primary'),
    fontWeight: '600',
  },
  { tag: [t.strong], fontWeight: '600', color: v('text-primary') },
  { tag: [t.emphasis], fontStyle: 'italic' },
  { tag: [t.strikethrough], textDecoration: 'line-through' },
  { tag: [t.link, t.url], color: v('accent-fg') },
  { tag: [t.monospace], color: v('syntax-key') },
  { tag: [t.quote], color: v('text-secondary') },
  { tag: [t.list], color: v('syntax-punct') },
  { tag: [t.number, t.bool, t.null, t.atom], color: v('syntax-date') },
  { tag: [t.content], color: v('syntax-text') },
])

const theme = EditorView.theme(
  {
    '&': {
      color: v('syntax-text'),
      backgroundColor: v('bg-card'),
      height: '100%',
      fontSize: 'var(--nt-text-mono-size)',
    },
    '.cm-scroller': {
      fontFamily: 'var(--nt-font-mono)',
      lineHeight: 'var(--nt-text-mono-line-height)',
      overflow: 'auto',
    },
    '.cm-content': { padding: '14px 0', caretColor: v('accent-fg-hover') },
    '.cm-line': { padding: '0 24px 0 24px' },
    '&.cm-focused': { outline: 'none' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: v('accent-fg-hover'), borderLeftWidth: '2px' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
      backgroundColor: v('accent-subtle'),
    },
    '.cm-activeLine': { backgroundColor: v('bg-active-line') },
    '.cm-gutters': { backgroundColor: v('bg-card'), color: v('text-line-number'), border: 'none' },
    '.cm-gutters .cm-gutterElement': { fontVariantNumeric: 'tabular-nums' },
    '.cm-lineNumbers .cm-gutterElement': {
      padding: '0 0 0 0',
      minWidth: '24px',
      textAlign: 'right',
    },
    '.cm-activeLineGutter': { backgroundColor: v('bg-active-line'), color: v('text-primary') },
    '.cm-diff-gutter': { width: '3px', marginLeft: '12px' },
    '.cm-diff-mark': { width: '3px', height: '100%' },
    '.cm-diff-added': { backgroundColor: v('diff-added') },
    '.cm-diff-modified': { backgroundColor: v('diff-modified') },
    '.cm-diff-deleted': {
      width: '0',
      height: '0',
      marginTop: 'calc(100% - 5px)',
      borderTop: '5px solid transparent',
      borderBottom: '5px solid transparent',
      borderLeft: `6px solid ${v('diff-deleted')}`,
      backgroundColor: 'transparent',
    },
    '.cm-lint-gutter': { width: '22px' },
    '.cm-lint-spacer': { display: 'block', width: '22px', height: '1px' },
    '.cm-lint-mark': {
      display: 'flex',
      width: '22px',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
    },
    '.cm-lint-warning': { color: v('diff-lint') },
    '.cm-lint-error': { color: v('status-danger') },
    '.cm-problem': {
      textDecoration: 'underline wavy',
      textDecorationThickness: '1px',
      textUnderlineOffset: '4px',
    },
    '.cm-problem-warning': { textDecorationColor: v('status-warning') },
    '.cm-problem-error': { textDecorationColor: v('status-danger') },
    '.cm-hint': {
      marginLeft: '28px',
      fontFamily: 'var(--nt-font-sans)',
      fontSize: 'var(--nt-text-caption-size)',
      color: v('status-warning-text'),
      fontStyle: 'italic',
    },
    '.cm-wikilink': { color: v('accent-fg'), borderBottom: `1px dotted ${v('accent-fg')}` },
    '.cm-date': { color: v('syntax-date') },
    '.cm-mention': { color: v('syntax-mention') },
    '.cm-check': { color: v('syntax-punct') },
    '.cm-tooltip': {
      backgroundColor: v('bg-overlay'),
      border: `1px solid ${v('border-overlay')}`,
      borderRadius: 'var(--nt-radius-sm)',
      boxShadow: 'var(--nt-shadow-popover)',
    },
    '.cm-tooltip-autocomplete ul li': {
      padding: '4px 10px',
      fontFamily: 'var(--nt-font-sans)',
      fontSize: 'var(--nt-text-caption-size)',
    },
    '.cm-tooltip-autocomplete ul li[aria-selected]': {
      backgroundColor: v('accent-subtle'),
      color: v('text-primary'),
    },
    '.cm-completionDetail': { marginLeft: '10px', color: v('text-muted'), fontStyle: 'normal' },
    '.cm-completionLabel': { fontFamily: 'var(--nt-font-mono)' },
  },
  { dark: true },
)

export interface EditorOptions {
  readonly onSave: () => void
  readonly targets: () => ReadonlyArray<LinkTarget>
}

export const editorExtensions = ({ onSave, targets }: EditorOptions): Extension[] => [
  headField,
  changesField,
  problemsField,
  yamlFrontmatter({ content: markdown({ base: markdownLanguage }) }),
  syntaxHighlighting(highlight),
  history(),
  EditorView.lineWrapping,
  diffGutter,
  lintGutter,
  lineNumbers(),
  highlightActiveLine(),
  highlightActiveLineGutter(),
  drawSelection(),
  problemDecorations,
  wikiLinks,
  dates,
  mentions,
  checks,
  wikiCompletion(targets),
  keymap.of([
    {
      key: 'Mod-s',
      preventDefault: true,
      run: () => {
        onSave()
        return true
      },
    },
    ...completionKeymap,
    ...historyKeymap,
    ...defaultKeymap,
  ]),
  theme,
]
