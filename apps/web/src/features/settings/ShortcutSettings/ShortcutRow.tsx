import { Button, Kbd } from '@netherite/ui'
import { useState } from 'react'
import { useI18nContext } from '@/infrastructure/i18n'
import {
  type ActionDefinition,
  type ActionId,
  actionLabel,
  actions,
  conflictsWith,
  formatShortcut,
  isBrowserReserved,
  isSequenceLeader,
  joinSteps,
  type Refusal,
  refusalFor,
  useResolvedShortcuts,
  useShortcutSettings,
} from '@/infrastructure/shortcuts'
import { useKeyRecorder } from './useKeyRecorder'

type RowState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'recording'; readonly refused?: string; readonly first?: string }
  | { readonly kind: 'clash'; readonly keys: string; readonly others: ReadonlyArray<ActionId> }

export function ShortcutRow({ id }: { readonly id: ActionId }) {
  const { LL } = useI18nContext()
  const text = LL.settings.shortcuts
  const manage = useShortcutSettings()
  const { keys, aliases } = useResolvedShortcuts()[id]
  const [state, setState] = useState<RowState>({ kind: 'idle' })
  const label = actionLabel(LL, id)
  const idle = () => setState({ kind: 'idle' })

  const refusalText: Readonly<Record<Refusal, (keys: string) => string>> = {
    modifier: (keys) => text.notAllowed({ keys }),
    browser: (keys) => text.browserKeys({ keys }),
    shared: (keys) => text.sharedKeys({ keys }),
    singleStep: () => text.singleStep(),
  }
  const refuse = (refusal: Refusal, keys: string) =>
    setState({ kind: 'recording', refused: refusalText[refusal](formatShortcut(keys)) })

  useKeyRecorder(
    state.kind === 'recording',
    (key) => {
      const first = state.kind === 'recording' ? state.first : undefined
      if (first === undefined && isSequenceLeader(key)) {
        const refusal = refusalFor(id, joinSteps(key, key))
        if (refusal === 'singleStep') refuse(refusal, key)
        else setState({ kind: 'recording', first: key })
        return
      }
      const pressed = first === undefined ? key : joinSteps(first, key)
      const refusal = refusalFor(id, pressed)
      if (refusal !== undefined) {
        refuse(refusal, pressed)
        return
      }
      const others = conflictsWith(id, pressed, manage.overrides)
      if (others.length > 0) {
        setState({ kind: 'clash', keys: pressed, others })
        return
      }
      manage.bind(id, pressed)
      idle()
    },
    idle,
  )

  const definition: ActionDefinition = actions[id]
  const reserved = keys !== null && aliases.length === 0 && isBrowserReserved(keys)
  return (
    <li className="sk-row" data-recording={state.kind === 'recording' || undefined}>
      <span className="sk-label">{label}</span>
      <span className="sk-keys">
        {state.kind === 'recording' ? (
          <span className="sk-press" role="status">
            {state.refused ??
              (state.first === undefined
                ? text.press()
                : text.pressSecond({ keys: formatShortcut(state.first) }))}
          </span>
        ) : keys === null ? (
          <span className="app-muted">{text.unbound()}</span>
        ) : (
          <Kbd>{formatShortcut(keys)}</Kbd>
        )}
      </span>
      <span className="sk-actions">
        {state.kind === 'recording' ? (
          <Button size="sm" onClick={idle}>
            {text.cancel()}
          </Button>
        ) : definition.fixed ? null : (
          <>
            <Button
              size="sm"
              aria-label={text.changeLabel({ action: label })}
              onClick={() => setState({ kind: 'recording' })}
            >
              {text.change()}
            </Button>
            {keys !== null && (
              <Button
                size="sm"
                variant="subtle"
                aria-label={text.clearLabel({ action: label })}
                onClick={() => manage.clear(id)}
              >
                {text.clear()}
              </Button>
            )}
            {manage.isCustom(id) && (
              <Button
                size="sm"
                variant="subtle"
                aria-label={text.resetLabel({ action: label })}
                onClick={() => manage.reset(id)}
              >
                {text.reset()}
              </Button>
            )}
          </>
        )}
      </span>
      {state.kind === 'clash' && (
        <div className="sk-clash" role="alert">
          <span>
            {text.inUse({
              keys: formatShortcut(state.keys),
              actions: state.others.map((o) => actionLabel(LL, o)).join(', '),
            })}
          </span>
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              manage.replace(id, state.keys, state.others)
              idle()
            }}
          >
            {text.replace()}
          </Button>
          <Button size="sm" onClick={idle}>
            {text.cancel()}
          </Button>
        </div>
      )}
      {reserved && <p className="sk-note">{text.reserved()}</p>}
    </li>
  )
}
