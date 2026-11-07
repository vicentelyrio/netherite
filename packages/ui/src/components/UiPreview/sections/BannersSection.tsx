import { useState } from 'react'
import { Banner } from '../../Banner'
import { Button } from '../../Button'
import { Stack } from '../../Stack'
import { PreviewSection } from '../PreviewSection'

export function BannersSection() {
  const [banner, setBanner] = useState(true)
  return (
    <PreviewSection title="Banners">
      <Stack gap="xs">
        {banner && (
          <Banner
            variant="warning"
            title="This doc may be out of date"
            actions={<Button size="sm">Mark reviewed</Button>}
            onClose={() => setBanner(false)}
          >
            12 commits touched the files it covers since 2026-01-15.
          </Banner>
        )}
        <Banner variant="info" title="Superseded">
          Replaced by ADR-00019.
        </Banner>
        <Banner variant="success" title="Saved">
          Nothing was committed.
        </Banner>
        <Banner
          variant="danger"
          title="Changed on disk"
          actions={<Button size="sm">Reload</Button>}
        >
          The file changed while you were editing it.
        </Banner>
      </Stack>
    </PreviewSection>
  )
}
