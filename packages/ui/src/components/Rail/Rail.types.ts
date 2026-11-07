import type { ReactNode } from 'react'

export interface RailItem {
  readonly id: string
  readonly label: string
  readonly icon: string
  readonly hint?: string
  readonly badge?: number
  readonly group?: string
}

export interface RailProps {
  readonly items: ReadonlyArray<RailItem>
  readonly active: string
  readonly onSelect: (id: string) => void
  readonly brand?: ReactNode
  readonly footer?: ReactNode
  readonly label?: string
}
