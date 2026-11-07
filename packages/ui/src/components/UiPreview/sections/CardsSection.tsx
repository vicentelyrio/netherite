import { useState } from 'react'
import { Card } from '../../Card'
import { PreviewCardBody } from '../PreviewCardBody'
import { PreviewSection } from '../PreviewSection'

export function CardsSection() {
  const [selected, setSelected] = useState('b')
  return (
    <PreviewSection title="Cards">
      <div className="nt-preview-cards">
        <Card>
          <PreviewCardBody id="TASK-00042" title="Plain card" />
        </Card>
        <Card interactive>
          <PreviewCardBody id="TASK-00043" title="Hover me" />
        </Card>
        {['a', 'b'].map((id) => (
          <Card key={id} selected={selected === id} onClick={() => setSelected(id)}>
            <PreviewCardBody
              id={`TASK-0004${id === 'a' ? 4 : 5}`}
              title={selected === id ? 'Selected card' : 'Click to select'}
            />
          </Card>
        ))}
        <Card dropTarget>
          <PreviewCardBody id="TASK-00046" title="Drop target" />
        </Card>
      </div>
    </PreviewSection>
  )
}
