import { render, screen, within } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { I18nProvider } from '@/infrastructure/i18n'
import { AdrBody } from './AdrBody'

const show = (source: string) =>
  render(
    <I18nProvider>
      <AdrBody source={source} />
    </I18nProvider>,
  )

describe('an ADR laid out as the design has it', () => {
  test('the Consequences split into better and costs', () => {
    show('# T\n\n## Consequences\n\n- \\+ Faster\n- \\- Costs more\n')
    const consequences = screen.getByRole('region', { name: 'Consequences' })
    expect(within(consequences).getByText('What gets better')).toBeVisible()
    expect(within(consequences).getByText('Faster')).toBeVisible()
    expect(within(consequences).getByText('What it costs')).toBeVisible()
    expect(within(consequences).getByText('Costs more')).toBeVisible()
  })

  test('a section gets no box from its name alone', () => {
    const { container } = show('# T\n\n## Decision\n\nDo it.\n')
    expect(screen.getByRole('heading', { name: 'Decision' })).toBeVisible()
    expect(screen.getByText('Do it.')).toBeVisible()
    expect(container.querySelector('blockquote')).toBeNull()
    expect(screen.queryByRole('region')).toBeNull()
  })

  test('a blockquote is what stands out, in any section', () => {
    const { container } = show('# T\n\n## Decision\n\n> Do it.\n\n## Notes\n\n> Mind this.\n')
    const quotes = [...container.querySelectorAll('.adr-body blockquote')]
    expect(quotes.map((q) => q.textContent?.trim())).toEqual(['Do it.', 'Mind this.'])
  })

  test('text with no sections is shown as it is', () => {
    const { container } = show('# T\n\nJust a note.\n')
    expect(screen.queryByRole('region')).toBeNull()
    expect(container).toHaveTextContent('Just a note.')
  })
})
