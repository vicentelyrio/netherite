import { nodeZoomLimits } from './GraphView.constants'

export const nodeZoom = (k: number): number =>
  Math.min(nodeZoomLimits.max, Math.max(nodeZoomLimits.min, k))
