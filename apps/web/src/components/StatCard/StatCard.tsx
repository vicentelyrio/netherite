import './StatCard.css'

export interface StatCardProps {
  readonly value: string | number
  readonly label: string
}

/** One number with what it counts. */
export function StatCard({ value, label }: StatCardProps) {
  return (
    <div className="stat-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}
