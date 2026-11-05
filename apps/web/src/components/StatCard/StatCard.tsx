import type { ReactNode } from 'react'
import './StatCard.css'

export interface StatCardProps {
  readonly value: string | number
  readonly label: string
  readonly note?: ReactNode
}

export function StatCard({ value, label, note }: StatCardProps) {
  return (
    <div className="stat-card">
      <strong>{value}</strong>
      <span>{label}</span>
      {note}
    </div>
  )
}
