import { NetheriteProvider } from '@netherite/ui'
import { render as plain, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, test } from 'vitest'
import { PageTemplate } from './PageTemplate'

const render = (ui: ReactElement) => plain(<NetheriteProvider env="test">{ui}</NetheriteProvider>)

describe('PageTemplate', () => {
  test('PageTemplate shows header, actions, toolbar and body; actions and toolbar are optional', () => {
    const { rerender } = render(
      <PageTemplate
        header={<h1>Title</h1>}
        actions={<button type="button">Act</button>}
        toolbar={<i>bar</i>}
      >
        body
      </PageTemplate>,
    )
    expect(screen.getByRole('heading', { name: 'Title' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Act' })).toBeTruthy()
    expect(screen.getByText('bar')).toBeTruthy()
    expect(screen.getByText('body')).toBeTruthy()
    rerender(
      <NetheriteProvider env="test">
        <PageTemplate header={<h1>Title</h1>}>body</PageTemplate>
      </NetheriteProvider>,
    )
    expect(screen.queryByText('bar')).toBeNull()
    expect(document.querySelector('.tpl-page-actions')).toBeNull()
  })
})
