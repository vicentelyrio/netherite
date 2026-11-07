import { adrStatuses } from '@netherite/tokens'
import { FreshnessLabel } from '../../FreshnessLabel'
import { Group } from '../../Group'
import { OrphanTag } from '../../OrphanTag'
import { StatusPill } from '../../StatusPill'
import { PreviewSection } from '../PreviewSection'
import { states } from '../UiPreview.constants'

export function StatusSection() {
  return (
    <PreviewSection title="Status">
      <Group gap="sm">
        {adrStatuses.map((status) => (
          <StatusPill key={status} kind="adr" status={status} />
        ))}
      </Group>
      <Group gap="sm">
        {states.map(([state, category]) => (
          <StatusPill key={state} kind="state" state={state} category={category} />
        ))}
      </Group>
      <Group gap="sm">
        <FreshnessLabel state="fresh" />
        <FreshnessLabel state="drifting" commits={3} since="2026-01-15" />
        <FreshnessLabel state="stale" commits={12} />
        <FreshnessLabel state="stale" commits={10} atLeast />
        <FreshnessLabel state="unknown" />
        <OrphanTag />
      </Group>
    </PreviewSection>
  )
}
