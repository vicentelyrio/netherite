import { NetheriteProvider } from '@netherite/ui'
import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { I18nProvider } from '@/infrastructure/i18n'
import { Breadcrumbs } from './Breadcrumbs'

describe('Breadcrumbs', () => {
  test('is a labelled navigation with the icon and the path', () => {
    render(
      <NetheriteProvider env="test">
        <I18nProvider>
          <Breadcrumbs icon="stacks">
            <a href="/knowledge">Knowledge</a>
            <strong>Decision log</strong>
          </Breadcrumbs>
        </I18nProvider>
      </NetheriteProvider>,
    )
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(nav.textContent).toContain('Knowledge')
    expect(nav.textContent).toContain('Decision log')
  })
})
