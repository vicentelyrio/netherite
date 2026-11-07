import { screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { renderUi } from '../../../test/helpers'
import { AdrStatusPill } from '../StatusPill'
import { TypeBadge } from '../TypeBadge'
import { defaultUiLabels, UiLabelsProvider } from './index'

describe('UI labels', () => {
  test('components read English until an app gives them other words', () => {
    renderUi(<TypeBadge type="task" />)
    expect(screen.getByText('Task')).toBeInTheDocument()
  })

  test('a provider replaces the words', () => {
    renderUi(
      <UiLabelsProvider
        labels={{
          ...defaultUiLabels,
          types: { ...defaultUiLabels.types, task: 'Tarea' },
          adrStatus: { ...defaultUiLabels.adrStatus, accepted: 'Aceptada' },
        }}
      >
        <TypeBadge type="task" />
        <AdrStatusPill status="accepted" />
      </UiLabelsProvider>,
    )
    expect(screen.getByText('Tarea')).toBeInTheDocument()
    expect(screen.getByText('Aceptada')).toBeInTheDocument()
  })
})
