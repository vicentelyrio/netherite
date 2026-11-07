import { color, type ItemTypeName } from '../color'
import { hollowAlpha } from './glyphBox'
import type { GlyphBox } from './graph.types'

export const badgeGlyph: Readonly<Record<ItemTypeName, GlyphBox>> = {
  goal: { width: 8, height: 8, radius: '50%', rotate: 0, fill: color.type.goal, border: 'none' },
  project: {
    width: 8,
    height: 8,
    radius: '50%',
    rotate: 0,
    fill: color.type.project,
    border: 'none',
  },
  task: { width: 8, height: 8, radius: '50%', rotate: 0, fill: color.type.task, border: 'none' },
  adr: { width: 6, height: 6, radius: '2px', rotate: 45, fill: color.type.adr, border: 'none' },
  doc: { width: 7, height: 7, radius: '3px', rotate: 0, fill: color.type.doc, border: 'none' },
  context: {
    width: 8,
    height: 8,
    radius: '50%',
    rotate: 0,
    fill: `${color.type.context}${hollowAlpha}`,
    border: `1.5px solid ${color.type.context}`,
  },
  runbook: {
    width: 9,
    height: 5,
    radius: '2px',
    rotate: 0,
    fill: color.type.runbook,
    border: 'none',
  },
}
