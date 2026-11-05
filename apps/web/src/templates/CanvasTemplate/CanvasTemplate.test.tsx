import { NetheriteProvider } from '@netherite/ui'
import { render as plain, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, test } from 'vitest'
import { CanvasTemplate } from './CanvasTemplate'

const render = (ui: ReactElement) => plain(<NetheriteProvider env="test">{ui}</NetheriteProvider>)

describe('CanvasTemplate', () => {
  test('CanvasTemplate renders the canvas and only the slots it is given', () => {
    render(<CanvasTemplate canvas={<p>graph</p>} header="head" footer="foot" />)
    expect(screen.getByText('graph')).toBeTruthy()
    expect(document.querySelector('.tpl-canvas-header')).not.toBeNull()
    expect(document.querySelector('.tpl-canvas-controls')).toBeNull()
    expect(document.querySelector('.tpl-canvas-footer')).not.toBeNull()
  })
})
