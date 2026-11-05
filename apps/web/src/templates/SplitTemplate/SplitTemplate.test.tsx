import { NetheriteProvider } from '@netherite/ui'
import { render as plain, screen, within } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, test } from 'vitest'
import { SplitTemplate } from './SplitTemplate'

const render = (ui: ReactElement) => plain(<NetheriteProvider env="test">{ui}</NetheriteProvider>)

describe('SplitTemplate', () => {
  test('SplitTemplate has a main area and a complementary aside', () => {
    render(<SplitTemplate header="h" main={<p>list</p>} aside={<p>detail</p>} />)
    expect(within(screen.getByRole('complementary')).getByText('detail')).toBeTruthy()
    expect(screen.getByText('list').parentElement?.className).toContain('mantine-Grid-col')
  })
})
