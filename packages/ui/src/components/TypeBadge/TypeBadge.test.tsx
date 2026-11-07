import { itemTypeNames } from '@netherite/tokens'
import { screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { renderUi } from '../../../test/helpers'
import { TypeBadge, typeLabels } from './index'

describe('TypeBadge', () => {
  test('names every type, with its colour on the label and the glyph', () => {
    const { container } = renderUi(
      <div>
        {itemTypeNames.map((t) => (
          <TypeBadge key={t} type={t} />
        ))}
      </div>,
    )
    for (const type of itemTypeNames) expect(screen.getByText(typeLabels[type])).toBeInTheDocument()
    const badges = [...container.querySelectorAll<HTMLElement>('.nt-type-badge')]
    expect(badges.map((b) => b.getAttribute('style'))).toEqual(
      itemTypeNames.map((t) => `--nt-badge-color: var(--nt-color-type-${t});`),
    )
    const glyphs = [...container.querySelectorAll<HTMLElement>('.nt-type-glyph')]
    expect(new Set(glyphs.map((g) => g.style.background)).size).toBe(itemTypeNames.length)
  })

  test('the knowledge types are drawn as the design draws them', () => {
    const { container } = renderUi(
      <div>
        <TypeBadge type="adr" />
        <TypeBadge type="doc" />
        <TypeBadge type="context" />
        <TypeBadge type="runbook" />
      </div>,
    )
    const [adr, doc, context, runbook] = [
      ...container.querySelectorAll<HTMLElement>('.nt-type-glyph'),
    ]
    expect([adr?.style.width, adr?.style.transform, adr?.style.borderRadius]).toEqual([
      '6px',
      'rotate(45deg)',
      '2px',
    ])
    expect([doc?.style.width, doc?.style.borderRadius]).toEqual(['7px', '3px'])
    expect([context?.style.width, context?.style.borderRadius]).toEqual(['8px', '50%'])
    expect(context?.style.border).toContain('1.5px solid')
    expect([runbook?.style.width, runbook?.style.height]).toEqual(['9px', '5px'])
  })

  test('a superseded ADR is a hollow diamond', () => {
    const { container } = renderUi(<TypeBadge type="adr" hollow />)
    const glyph = container.querySelector<HTMLElement>('.nt-type-glyph')
    expect(glyph?.style.background).toBe('transparent')
    expect(glyph?.style.border).toContain('1.5px solid')
  })

  test('shape-only keeps the name for screen readers', () => {
    renderUi(<TypeBadge type="adr" glyphOnly />)
    expect(screen.getByText('ADR')).toHaveClass('nt-visually-hidden')
  })
})
