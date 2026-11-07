import { designColor } from '@netherite/ui'

const markers = [
  ['gv-arrow', designColor.graph.arrow],
  ['gv-arrow-hot', designColor.accent.edgeActive],
] as const

export function GraphArrows() {
  return (
    <defs>
      {markers.map(([id, fill]) => (
        <marker
          key={id}
          id={id}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          markerUnits="userSpaceOnUse"
          orient="auto"
        >
          <path d="M0,1 L10,5 L0,9 z" fill={fill} />
        </marker>
      ))}
    </defs>
  )
}
