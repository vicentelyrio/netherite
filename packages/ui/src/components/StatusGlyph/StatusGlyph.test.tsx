import { screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { renderUi } from '../../../test/helpers'
import { StatusGlyph } from './index'

describe('StatusGlyph', () => {
  const look = (status: 'backlog' | 'progress' | 'hold' | 'done', progress = 0.5, size = 12) => {
    renderUi(
      <StatusGlyph type="task" status={status} progress={progress} size={size} label={status} />,
    )
    return screen.getByRole('img', { name: status })
  }

  test('backlog is an empty pie on a ring', () => {
    const glyph = look('backlog', 0)
    expect(glyph.style.background).toContain('conic-gradient')
    expect(glyph.style.background).toContain('0%')
    expect(glyph.style.border).toContain('solid')
    expect(glyph.style.boxShadow).toBe('none')
  })

  test('in progress fills the pie to the share done and has a halo', () => {
    const glyph = look('progress', 0.6)
    expect(glyph.style.background).toContain('60%')
    expect(glyph.style.boxShadow).toContain('--nt-status-halo-gap')
  })

  test('on hold is a grey pie on a dashed ring', () => {
    const glyph = look('hold', 0.4)
    expect(glyph.style.background).toContain('--nt-status-hold')
    expect(glyph.style.border).toContain('dashed')
  })

  test('done is solid with a check, and can be drawn fainter', () => {
    renderUi(<StatusGlyph type="project" status="done" size={14} label="done" dimDone />)
    const glyph = screen.getByRole('img', { name: 'done' })
    expect(glyph.querySelector('svg')).not.toBeNull()
    expect(glyph.style.background).toContain('--nt-color-type-project')
    expect(glyph.style.opacity).toContain('--nt-status-done-opacity')
  })

  test('the hue is the type, whatever the status', () => {
    renderUi(<StatusGlyph type="goal" status="progress" progress={0.3} label="goal" />)
    expect(screen.getByRole('img', { name: 'goal' }).style.border).toContain('--nt-color-type-goal')
  })

  test('size sets the diameter, and a big glyph has a thicker ring', () => {
    const small = look('backlog', 0, 8)
    expect(small.style.width).toBe('8px')
    expect(small.style.border).toContain('--nt-status-ring-thin')
    renderUi(<StatusGlyph type="goal" status="backlog" size={32} label="big" />)
    const big = screen.getByRole('img', { name: 'big' })
    expect(big.style.width).toBe('32px')
    expect(big.style.border).toContain('--nt-status-ring-thick')
  })

  test('without a label it is decoration', () => {
    const { container } = renderUi(<StatusGlyph type="task" status="done" />)
    expect(container.querySelector('[aria-hidden="true"].nt-status-glyph')).not.toBeNull()
  })
})
