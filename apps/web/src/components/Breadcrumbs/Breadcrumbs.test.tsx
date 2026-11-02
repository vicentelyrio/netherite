import { NetheriteProvider } from '@netherite/ui'
import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { Breadcrumbs } from './Breadcrumbs'

describe('Breadcrumbs', () => {
  test('is a labelled navigation with the icon and the path', () => {
    render(
      <NetheriteProvider env="test">
        <Breadcrumbs icon="stacks">
          <a href="/knowledge">Knowledge</a>
          <strong>Decision log</strong>
        </Breadcrumbs>
      </NetheriteProvider>,
    )
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(nav.textContent).toContain('Knowledge')
    expect(nav.textContent).toContain('Decision log')
  })
})
