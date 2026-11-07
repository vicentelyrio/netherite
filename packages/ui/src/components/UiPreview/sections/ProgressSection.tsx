import { Group } from '../../Group'
import { Progress } from '../../Progress'
import { ProgressRing } from '../../ProgressRing'
import { Stack } from '../../Stack'
import { PreviewSection } from '../PreviewSection'
import { bigRingSize, progressMaxWidth } from '../UiPreview.constants'

export function ProgressSection() {
  return (
    <PreviewSection title="Progress">
      <Stack gap="xs" maw={progressMaxWidth}>
        <Progress done={3} total={8} />
        <Progress done={8} total={8} />
      </Stack>
      <Group gap="md">
        <ProgressRing done={3} total={8} />
        <ProgressRing done={8} total={8} />
        <ProgressRing done={5} total={12} size={bigRingSize} showCount />
      </Group>
    </PreviewSection>
  )
}
