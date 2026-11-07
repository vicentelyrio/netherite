import { Group } from '../Group'
import { Progress } from '../Progress'
import { Stack } from '../Stack'
import { TypeBadge } from '../TypeBadge'
import { cardBodyGap } from './UiPreview.constants'

export function PreviewCardBody({ id, title }: { readonly id: string; readonly title: string }) {
  return (
    <Stack gap={cardBodyGap}>
      <Group justify="space-between" gap="xs">
        <TypeBadge type="task" />
        <code className="nt-preview-id">{id}</code>
      </Group>
      <div>{title}</div>
      <Progress done={2} total={5} />
    </Stack>
  )
}
