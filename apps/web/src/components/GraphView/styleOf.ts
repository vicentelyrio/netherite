import { type EdgeKind, edgeStyle } from '@netherite/ui'

const variableOf = (kind: string) => `var(--nt-edge-${kind.replaceAll('_', '-')}-color)`

export const styleOf = (kind: string) => {
  const known = Object.hasOwn(edgeStyle, kind)
  const style = known ? edgeStyle[kind as EdgeKind] : edgeStyle.reference
  return { ...style, color: variableOf(known ? kind : 'reference') }
}
