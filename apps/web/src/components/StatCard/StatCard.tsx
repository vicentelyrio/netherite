import type { ReactNode } from 'react'
import './StatCard.css'

export interface StatCardProps {
  readonly value: string | number
  readonly label: string
  /** A line under the label, such as how the number moved. */
  readonly note?: ReactNode
}

/** One number with what it counts. */
export function StatCard({ value, label, note }: StatCardProps) {
  return (
    <div className="stat-card">
      <strong>{value}</strong>
      <span>{label}</span>
      {note}
    </div>
  )
}
