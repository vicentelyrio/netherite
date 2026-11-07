import { color, type ItemTypeName, tint } from '../color'
import type { GlyphBox, NodeShape } from './graph.types'
import { nodeSpec } from './nodeSpec'

export const hollowAlpha = Math.round(tint.ring * 255)
  .toString(16)
  .padStart(2, '0')

const Radius = { Diamond: '2px', Soft: '3px', Round: '50%' } as const
const none = 'none'

type Painter = (d: number, c: string, hollow: boolean) => GlyphBox

const circle: Painter = (d, c) => ({
  width: d,
  height: d,
  radius: Radius.Round,
  rotate: 0,
  fill: c,
  border: none,
})

const painters: Partial<Record<NodeShape, Painter>> = {
  diamond: (d, c, hollow) => ({
    width: d * 0.78,
    height: d * 0.78,
    radius: Radius.Diamond,
    rotate: 45,
    fill: hollow ? 'transparent' : c,
    border: hollow ? `1.5px solid ${c}` : none,
  }),
  square: (d, c) => ({
    width: d * 0.86,
    height: d * 0.86,
    radius: Radius.Soft,
    rotate: 0,
    fill: c,
    border: none,
  }),
  ring: (d, c) => ({
    width: d,
    height: d,
    radius: Radius.Round,
    rotate: 0,
    fill: `${c}${hollowAlpha}`,
    border: `2px solid ${c}`,
  }),
  bar: (d, c) => ({
    width: d * 1.3,
    height: d * 0.7,
    radius: Radius.Soft,
    rotate: 0,
    fill: c,
    border: none,
  }),
}

export const glyphBox = (type: ItemTypeName, diameter: number, hollow = false): GlyphBox =>
  (painters[nodeSpec[type].shape] ?? circle)(diameter, color.type[type], hollow)
