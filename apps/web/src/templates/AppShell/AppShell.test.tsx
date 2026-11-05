import { NetheriteProvider } from '@netherite/ui'
import { render as plain, screen, within } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, test } from 'vitest'
import { AppShell } from './AppShell'

const render = (ui: ReactElement) => plain(<NetheriteProvider env="test">{ui}</NetheriteProvider>)

describe('AppShell', () => {
  test('AppShell puts the rail, status bar, screen and overlays in their places', () => {
    render(
      <AppShell rail={<nav>rail</nav>} statusBar={<div>status</div>} overlays={<div>overlay</div>}>
        <p>screen</p>
      </AppShell>,
    )
    expect(within(screen.getByRole('main')).getByText('screen')).toBeTruthy()
    expect(screen.getByText('rail')).toBeTruthy()
    expect(screen.getByText('status')).toBeTruthy()
    expect(screen.getByText('overlay')).toBeTruthy()
  })
})
