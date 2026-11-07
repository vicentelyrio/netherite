import type { ReactNode } from 'react'

export interface NetheriteProviderProps {
  readonly children: ReactNode
  readonly root?: () => HTMLElement | null
  readonly env?: 'default' | 'test'
  readonly colorScheme?: 'dark' | 'light'
}
