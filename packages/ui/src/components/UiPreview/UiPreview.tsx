import { useState } from 'react'
import { Avatar } from '../Avatar'
import { Rail } from '../Rail'
import { BannersSection } from './sections/BannersSection'
import { ButtonsSection } from './sections/ButtonsSection'
import { CardsSection } from './sections/CardsSection'
import { ControlsSection } from './sections/ControlsSection'
import { EmptyStateSection } from './sections/EmptyStateSection'
import { ItemTypesSection } from './sections/ItemTypesSection'
import { OverlaysSection } from './sections/OverlaysSection'
import { ProgressSection } from './sections/ProgressSection'
import { StatusSection } from './sections/StatusSection'
import { avatarSize, defaultActive, previewUser, railItems } from './UiPreview.constants'

export function UiPreview() {
  const [active, setActive] = useState(defaultActive)
  return (
    <div className="nt-preview">
      <div className="nt-preview-rail">
        <Rail
          items={railItems}
          active={active}
          onSelect={setActive}
          footer={<Avatar name={previewUser} size={avatarSize} color="warning" />}
        />
      </div>
      <main className="nt-preview-main">
        <header className="nt-preview-header">
          <h1 className="nt-preview-h1">Netherite components</h1>
          <span className="nt-preview-note">The Netherite Refined design, dark only</span>
        </header>
        <ItemTypesSection />
        <StatusSection />
        <ButtonsSection />
        <ControlsSection />
        <CardsSection />
        <ProgressSection />
        <OverlaysSection />
        <BannersSection />
        <EmptyStateSection />
      </main>
    </div>
  )
}
