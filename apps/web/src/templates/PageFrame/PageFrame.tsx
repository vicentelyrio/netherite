import { Box } from '@netherite/ui'
import type { ReactNode } from 'react'

/** The page's margins from the grid tokens: wide at the start on large screens, compact below. */
export function PageFrame({ children }: { readonly children: ReactNode }) {
  return (
    <Box
      pl={{ base: 'var(--nt-grid-margin-compact)', lg: 'var(--nt-grid-margin-start)' }}
      pr={{ base: 'var(--nt-grid-margin-compact)', lg: 'var(--nt-grid-margin-end)' }}
      py={40}
    >
      {children}
    </Box>
  )
}
