import { screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { renderUi } from '../../../test/helpers'
import { Icon } from './index'

describe('Icon', () => {
  test('is hidden from screen readers unless it has a label', () => {
    const { container } = renderUi(<Icon name="check" />)
    const icon = container.querySelector('.nt-icon')
    expect(icon).toHaveTextContent('check')
    expect(icon).toHaveAttribute('aria-hidden', 'true')
    renderUi(<Icon name="warning" label="Warning" />)
    expect(screen.getByRole('img', { name: 'Warning' })).toBeInTheDocument()
  })

  test('sizes and strokes are the design’s: rail 22 at 300, switcher 20 at 300, inline 16 at 400, pill 14 at 500', () => {
    const { container } = renderUi(
      <div>
        <Icon name="a" size="rail" />
        <Icon name="b" size="switcher" />
        <Icon name="c" />
        <Icon name="d" size="pill" />
        <Icon name="e" size={13} weight={500} filled />
      </div>,
    )
    const icons = [...container.querySelectorAll<HTMLElement>('.nt-icon')]
    expect(icons.map((e) => e.style.fontSize)).toEqual(['22px', '20px', '16px', '14px', '13px'])
    expect(icons.map((e) => e.style.fontVariationSettings)).toEqual([
      "'FILL' 0, 'wght' 300",
      "'FILL' 0, 'wght' 300",
      "'FILL' 0, 'wght' 400",
      "'FILL' 0, 'wght' 500",
      "'FILL' 1, 'wght' 500",
    ])
  })
})
