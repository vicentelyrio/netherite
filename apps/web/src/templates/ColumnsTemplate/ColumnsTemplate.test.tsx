import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { ColumnsTemplate } from './ColumnsTemplate'

describe('ColumnsTemplate', () => {
  test('keeps the header outside the part that scrolls', () => {
    render(
      <ColumnsTemplate header="h">
        <p>a</p>
      </ColumnsTemplate>,
    )
    const scroller = screen.getByText('a').parentElement
    expect(scroller).toHaveClass('tpl-columns-scroll')
    expect(scroller).not.toContainElement(screen.getByText('h'))
  })
})
