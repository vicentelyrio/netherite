import { type Extension, Facet } from '@codemirror/state'
import { EditorView, ViewPlugin } from '@codemirror/view'
import { Vim, vim } from '@replit/codemirror-vim'
import { v } from './tokens'

const overlayEscapeGuard = 'data-mantine-stop-propagation'

const saveCommand = Facet.define<() => void, () => void>({
  combine: (commands) => commands[0] ?? (() => {}),
})

Vim.defineEx('write', 'w', (cm) => cm.cm6.state.facet(saveCommand)())

const keepEscapeInEditor = ViewPlugin.define((view) => {
  const guard = ({ target }: FocusEvent) => {
    if (target instanceof HTMLElement) target.setAttribute(overlayEscapeGuard, 'true')
  }
  view.dom.addEventListener('focusin', guard)
  return { destroy: () => view.dom.removeEventListener('focusin', guard) }
})

const vimTheme = EditorView.theme({
  '.cm-vimCursorLayer .cm-fat-cursor': {
    background: v('accent-fg-hover'),
    color: `${v('bg-card')} !important`,
  },
  '&:not(.cm-focused) .cm-vimCursorLayer .cm-fat-cursor': {
    background: 'none',
    outlineColor: v('accent-fg-hover'),
  },
  '.cm-panels': {
    backgroundColor: v('bg-card'),
    color: v('text-muted'),
  },
  '.cm-panels-bottom': { borderTop: `1px solid ${v('border-subtle')}` },
  '.cm-vim-panel': {
    padding: '2px 24px',
    fontFamily: 'var(--nt-font-mono)',
    fontSize: 'var(--nt-text-caption-size)',
  },
  '.cm-vim-panel input': { color: v('text-primary') },
})

export const vimKeys = (onSave: () => void): Extension => [
  vim({ status: true }),
  saveCommand.of(onSave),
  keepEscapeInEditor,
  vimTheme,
]
