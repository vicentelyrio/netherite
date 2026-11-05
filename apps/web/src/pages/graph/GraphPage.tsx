import { GraphCanvas, GraphHeading, GraphScrubber, GraphTimeProvider } from '@/features/graph'
import { CanvasTemplate } from '@/templates'

/** The graph: every item and its links, over the whole screen, with a slider through time. */
export function GraphPage({ focus }: { readonly focus?: string | undefined }) {
  return (
    <GraphTimeProvider>
      <CanvasTemplate
        header={<GraphHeading focus={focus} />}
        canvas={<GraphCanvas focus={focus} />}
        footer={<GraphScrubber />}
      />
    </GraphTimeProvider>
  )
}
