import { type EdgeKind, edgeStyle } from '@netherite/ui'

export const styleOf = (kind: string) => edgeStyle[kind as EdgeKind] ?? edgeStyle.reference
