import { itemTypeNames } from '@netherite/tokens'
import { Group } from '../../Group'
import { TypeBadge } from '../../TypeBadge'
import { PreviewSection } from '../PreviewSection'

export function ItemTypesSection() {
  return (
    <PreviewSection title="Item types · badge and graph shape">
      <Group gap="lg">
        {itemTypeNames.map((type) => (
          <TypeBadge key={type} type={type} />
        ))}
      </Group>
      <Group gap="lg">
        {itemTypeNames.map((type) => (
          <TypeBadge key={type} type={type} glyphOnly />
        ))}
        <TypeBadge type="adr" hollow />
      </Group>
    </PreviewSection>
  )
}
