import type { GoalRow } from '@netherite/api'
import { Card } from '@netherite/ui'
import { Link } from '@tanstack/react-router'
import { DragFrame } from '../CardParts'
import { noArea } from '../GoalAreas/areas'
import { GoalCardBody } from './GoalCardBody'

export function GoalCard({ goal }: { readonly goal: GoalRow }) {
  return (
    <DragFrame id={goal.id} list={goal.area ?? noArea}>
      <Link to="/goals/$id" params={{ id: goal.id }} className="app-row-link" draggable={false}>
        <Card interactive>
          <GoalCardBody goal={goal} />
        </Card>
      </Link>
    </DragFrame>
  )
}
