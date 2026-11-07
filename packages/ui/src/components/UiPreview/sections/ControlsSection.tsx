import { useState } from 'react'
import { Avatar } from '../../Avatar'
import { Chip } from '../../Chip'
import { Group } from '../../Group'
import { SegmentedControl } from '../../SegmentedControl'
import { Switch } from '../../Switch'
import { PreviewSection } from '../PreviewSection'

export function ControlsSection() {
  const [chips, setChips] = useState({ stale: true, orphans: false })
  const [switched, setSwitched] = useState(true)
  return (
    <PreviewSection title="Chips, avatars, switch">
      <Group gap="sm">
        <Chip checked={chips.stale} onChange={(stale) => setChips({ ...chips, stale })}>
          Stale
        </Chip>
        <Chip checked={chips.orphans} onChange={(orphans) => setChips({ ...chips, orphans })}>
          Orphans
        </Chip>
        <Avatar name="@ada" />
        <Avatar name="Grace Hopper" />
        <Avatar name="@vicentelyrio" size="md" />
        <SegmentedControl
          data={[
            { value: 'code', label: 'code' },
            { value: 'text', label: 'text' },
          ]}
          defaultValue="code"
        />
        <Switch
          checked={switched}
          onChange={(e) => setSwitched(e.currentTarget.checked)}
          label="Include in context"
        />
      </Group>
    </PreviewSection>
  )
}
