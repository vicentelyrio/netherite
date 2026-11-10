import { designColor } from '@netherite/ui'
import { arrowSize } from './GraphView.constants'

const markers = [
  ['gv-arrow', designColor.graph.arrow],
  ['gv-arrow-hot', designColor.accent.edgeActive],
] as const

export function GraphArrows({ zoom }: { readonly zoom: number }) {
  return (
    <defs>
      {markers.map(([id, fill]) => (
        <marker
          key={id}
          id={id}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth={arrowSize * zoom}
          markerHeight={arrowSize * zoom}
          markerUnits="userSpaceOnUse"
          orient="auto"
        >
          <path d="M0,1 L10,5 L0,9 z" fill={fill} />
        </marker>
      ))}
    </defs>
  )
}
