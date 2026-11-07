import { adrStatuses } from '@netherite/tokens'
import { screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { renderUi } from '../../../test/helpers'
import { StatusPill } from './index'

describe('StatusPill', () => {
  test('an ADR status and a task state read as words', () => {
    renderUi(
      <>
        {adrStatuses.map((status) => (
          <StatusPill key={status} kind="adr" status={status} />
        ))}
        <StatusPill kind="state" state="in review" category="active" />
      </>,
    )
    for (const word of ['Proposed', 'Accepted', 'Deprecated', 'Superseded', 'In review']) {
      expect(screen.getByText(word)).toBeInTheDocument()
    }
    expect(screen.getByText('In review')).toHaveAttribute('data-value', 'active')
  })

  test('the colour comes from the matching token', () => {
    renderUi(<StatusPill kind="adr" status="accepted" />)
    expect(screen.getByText('Accepted').getAttribute('style')).toContain(
      'var(--nt-color-adr-accepted)',
    )
  })
})
