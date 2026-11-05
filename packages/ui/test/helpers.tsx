import { type RenderResult, render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { NetheriteProvider } from '../src/index'

/**
 * Renders inside the app's provider, as the app does, with `env="test"`: no transitions and no
 * portals. With them a menu or a modal is `display: none` until a timer fires, which on a busy CI
 * runner can take longer than any wait a test is willing to do.
 */
export const renderUi = (ui: ReactElement): RenderResult =>
  render(ui, {
    wrapper: ({ children }) => <NetheriteProvider env="test">{children}</NetheriteProvider>,
  })
