import { ActionIcon } from '../../ActionIcon'
import { Button } from '../../Button'
import { Group } from '../../Group'
import { PreviewSection } from '../PreviewSection'

export function ButtonsSection() {
  return (
    <PreviewSection title="Buttons">
      <Group gap="sm">
        <Button variant="primary" icon="add">
          New task
        </Button>
        <Button>Secondary</Button>
        <Button variant="subtle" icon="edit">
          Subtle
        </Button>
        <Button variant="danger" icon="delete">
          Delete
        </Button>
        <Button loading>Saving</Button>
        <Button disabled>Disabled</Button>
      </Group>
      <Group gap="xs">
        <ActionIcon icon="search" label="Search" />
        <ActionIcon icon="filter_list" label="Filter" active />
        <ActionIcon icon="more_horiz" label="More" />
        <ActionIcon icon="close" label="Close" disabled />
      </Group>
    </PreviewSection>
  )
}
