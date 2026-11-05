import { NetheriteProvider } from '@netherite/ui'
import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { CardGridTemplate } from './CardGridTemplate'

describe('CardGridTemplate', () => {
  test('renders its header and the columns it is given', () => {
    render(
      <NetheriteProvider env="test">
        <CardGridTemplate header="h">
          <p>a</p>
          <p>b</p>
        </CardGridTemplate>
      </NetheriteProvider>,
    )
    expect(screen.getByText('h')).toBeTruthy()
    expect(screen.getByText('a')).toBeTruthy()
    expect(screen.getByText('b')).toBeTruthy()
  })
})
