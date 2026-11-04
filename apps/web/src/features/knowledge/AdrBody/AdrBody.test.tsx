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
  test('the Decision is in its own box and the Consequences split into better and costs', () => {
    show(
      '# T\n\n## Context\n\nWhy.\n\n## Decision\n\nDo it.\n\n## Consequences\n\n- \\+ Faster\n- \\- Costs more\n',
    )
    expect(
      within(screen.getByRole('region', { name: 'Decision' })).getByText('Do it.'),
    ).toBeVisible()
    const consequences = screen.getByRole('region', { name: 'Consequences' })
    expect(within(consequences).getByText('What gets better')).toBeVisible()
    expect(within(consequences).getByText('Faster')).toBeVisible()
    expect(within(consequences).getByText('What it costs')).toBeVisible()
    expect(within(consequences).getByText('Costs more')).toBeVisible()
  })

  test('text with no Decision section is shown as it is', () => {
    const { container } = show('# T\n\nJust a note.\n')
    expect(screen.queryByRole('region')).toBeNull()
    expect(container).toHaveTextContent('Just a note.')
  })
})
