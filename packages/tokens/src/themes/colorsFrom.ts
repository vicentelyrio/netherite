import { color } from '../color'
import { hexToRgb } from '../contrast'
import { mix } from '../mantine'
import type { ColorSet, ThemeSeed } from './themes.types'

const labelOpacity = 0.85

const translucent = (hex: string, opacity: number) => {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

export const colorsFrom = (seed: ThemeSeed): ColorSet => {
  const lift = (surface: string, amount: number) => mix(surface, seed.primary, amount)
  const quiet = mix(seed.muted, seed.canvas, 0.25)
  return {
    base: color.base,
    bg: {
      shell: seed.shell,
      canvas: seed.canvas,
      card: seed.card,
      cardHover: lift(seed.card, 0.03),
      cardSelected: lift(seed.card, 0.05),
      column: lift(seed.canvas, 0.05),
      sunken: seed.sunken,
      chip: lift(seed.canvas, 0.06),
      overlay: seed.overlay,
      track: lift(seed.canvas, 0.14),
      activeLine: lift(seed.card, 0.04),
      thumb: seed.scheme === 'dark' ? color.bg.thumb : color.base.white,
      stage: seed.stage,
    },
    border: {
      rail: lift(seed.card, 0.07),
      subtle: lift(seed.card, 0.11),
      divider: lift(seed.card, 0.14),
      overlay: lift(seed.card, 0.2),
      strong: lift(seed.card, 0.3),
    },
    text: {
      primary: seed.primary,
      secondary: seed.secondary,
      muted: seed.muted,
      faint: quiet,
      lineNumber: seed.muted,
      icon: mix(seed.secondary, seed.muted, 0.5),
      onAccent: seed.onAccent,
    },
    accent: {
      fg: seed.accent,
      fgHover: mix(seed.accent, seed.primary, 0.35),
      solid: seed.solid,
      subtle: mix(seed.shell, seed.solid, 0.22),
      edgeActive: mix(seed.accent, seed.primary, 0.2),
    },
    status: {
      success: seed.success,
      warning: seed.warning,
      warningText: seed.warning,
      danger: seed.danger,
      context: seed.type.context,
    },
    type: seed.type,
    state: {
      todo: seed.muted,
      active: seed.accent,
      blocked: seed.warning,
      done: seed.success,
    },
    adr: {
      proposed: seed.accent,
      accepted: seed.success,
      deprecated: seed.danger,
      superseded: seed.secondary,
    },
    freshness: {
      fresh: seed.success,
      drifting: seed.warning,
      stale: seed.warning,
      unknown: seed.muted,
    },
    syntax: {
      key: seed.key,
      string: seed.string,
      date: seed.date,
      mention: seed.accent,
      punct: seed.muted,
      text: mix(seed.primary, seed.secondary, 0.5),
    },
    diff: {
      added: seed.success,
      modified: seed.warning,
      deleted: seed.danger,
      lint: seed.warning,
    },
    graph: {
      edge: lift(seed.canvas, 0.25),
      edgeTyped: lift(seed.canvas, 0.35),
      edgeWarm: lift(seed.canvas, 0.45),
      arrow: lift(seed.canvas, 0.4),
      sample: seed.secondary,
      labelBg: translucent(seed.shell, labelOpacity),
    },
  }
}
