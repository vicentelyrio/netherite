import { type RenderResult, render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { NetheriteProvider } from '../src/index'

/** Renders inside the app's provider, as the app does. */
export const renderUi = (ui: ReactElement): RenderResult =>
  render(ui, { wrapper: ({ children }) => <NetheriteProvider>{children}</NetheriteProvider> })
