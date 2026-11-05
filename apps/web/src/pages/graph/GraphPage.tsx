import { GraphCanvas, GraphHeading, GraphScrubber, GraphTimeProvider } from '@/features/graph'
import { CanvasTemplate } from '@/templates'

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
