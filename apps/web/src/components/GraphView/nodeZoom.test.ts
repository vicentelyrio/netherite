import { describe, expect, test } from 'vitest'
import { nodeZoomLimits } from './GraphView.constants'
import { nodeZoom } from './nodeZoom'

describe('the zoom applied to nodes', () => {
  test('follows the view while zooming out', () => {
    expect(nodeZoom(0.5)).toBe(0.5)
  })

  test('never grows nodes past their full size', () => {
    expect(nodeZoom(1)).toBe(nodeZoomLimits.max)
    expect(nodeZoom(3)).toBe(nodeZoomLimits.max)
  })

  test('stops shrinking at the smallest legible size', () => {
    expect(nodeZoom(0.01)).toBe(nodeZoomLimits.min)
  })
})
