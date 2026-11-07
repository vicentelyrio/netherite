import { icon as iconTokens } from '@netherite/tokens'
import type { CSSProperties } from 'react'
import type { IconProps, IconSize } from './Icon.types'

const metricsOf = (size: IconSize) =>
  typeof size === 'number' ? { size, weight: iconTokens.inline.weight } : iconTokens[size]

export const iconStyle = (
  size: IconSize,
  weight: IconProps['weight'],
  filled: boolean | undefined,
): CSSProperties => {
  const metrics = metricsOf(size)
  return {
    fontSize: metrics.size,
    width: metrics.size,
    height: metrics.size,
    lineHeight: `${metrics.size}px`,
    fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight ?? metrics.weight}`,
  }
}
