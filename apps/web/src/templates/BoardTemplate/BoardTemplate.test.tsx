import { NetheriteProvider } from '@netherite/ui'
import { render as plain, screen, within } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, test } from 'vitest'
import { BoardTemplate } from './BoardTemplate'

const render = (ui: ReactElement) => plain(<NetheriteProvider env="test">{ui}</NetheriteProvider>)

describe('BoardTemplate', () => {
  test('BoardTemplate has a side column, a tabpanel for the board and an overlay', () => {
    render(<BoardTemplate side={<p>side</p>} main={<p>board</p>} overlay={<p>drawer</p>} />)
    expect(within(screen.getByRole('complementary')).getByText('side')).toBeTruthy()
    expect(within(screen.getByRole('tabpanel')).getByText('board')).toBeTruthy()
    expect(screen.getByText('drawer')).toBeTruthy()
  })
})
