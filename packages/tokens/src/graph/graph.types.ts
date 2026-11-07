export type NodeShape = 'circle' | 'diamond' | 'square' | 'ring' | 'bar'

export interface NodeSpec {
  readonly shape: NodeShape
  readonly radius: number
}

export interface GlyphBox {
  readonly width: number
  readonly height: number
  readonly radius: string
  readonly rotate: number
  readonly fill: string
  readonly border: string
}

export interface EdgeStyle {
  readonly width: number
  readonly dash: readonly number[]
  readonly arrow: boolean
  readonly opacity: number
  readonly color: string
  readonly inDesign: boolean
}
