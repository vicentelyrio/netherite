import { GraphCanvas, GraphHeading } from '@/features/graph'
import { CanvasTemplate } from '@/templates'

/** The graph: every item and its links, over the whole screen. */
export function GraphPage({ focus }: { readonly focus?: string | undefined }) {
  return (
    <CanvasTemplate
      header={<GraphHeading focus={focus} />}
      canvas={<GraphCanvas focus={focus} />}
    />
  )
}
