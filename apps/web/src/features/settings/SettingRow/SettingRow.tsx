import type { ReactNode } from 'react'
import './SettingRow.css'

export function SettingRow({
  label,
  hint,
  children,
}: {
  readonly label: string
  readonly hint: string
  readonly children: ReactNode
}) {
  return (
    <div className="sr">
      <div className="sr-text">
        <div className="sr-label">{label}</div>
        <div className="sr-hint">{hint}</div>
      </div>
      {children}
    </div>
  )
}
