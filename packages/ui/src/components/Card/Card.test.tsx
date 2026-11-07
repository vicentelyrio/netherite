import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import { renderUi } from '../../../test/helpers'
import { Card } from './index'

describe('Card', () => {
  test('a plain card is not a control', () => {
    const { container } = renderUi(<Card>content</Card>)
    const card = container.querySelector('.nt-card') as HTMLElement
    expect(card).not.toHaveAttribute('tabindex')
    expect(card).not.toHaveAttribute('data-interactive')
  })

  test('a clickable card can be reached and used with the keyboard', async () => {
    const onClick = vi.fn()
    renderUi(<Card onClick={onClick}>open</Card>)
    const card = screen.getByRole('button', { name: 'open' })
    expect(card).toHaveAttribute('tabindex', '0')
    await userEvent.click(card)
    card.focus()
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(3)
  })

  test('selected and drop-target states are marked for the styles and for assistive tech', () => {
    const { container } = renderUi(
      <>
        <Card selected onClick={() => {}}>
          a
        </Card>
        <Card dropTarget>b</Card>
      </>,
    )
    const [selected, target] = [...container.querySelectorAll('.nt-card')]
    expect(selected).toHaveAttribute('data-selected', 'true')
    expect(selected).toHaveAttribute('aria-pressed', 'true')
    expect(target).toHaveAttribute('data-drop-target', 'true')
    expect(target).not.toHaveAttribute('data-selected')
  })
})
