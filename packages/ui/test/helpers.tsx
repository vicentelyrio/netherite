import { type RenderResult, render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { NetheriteProvider } from '../src/index'

export const renderUi = (ui: ReactElement): RenderResult =>
  render(ui, {
    wrapper: ({ children }) => <NetheriteProvider env="test">{children}</NetheriteProvider>,
  })
