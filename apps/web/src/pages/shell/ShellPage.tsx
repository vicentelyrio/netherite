import { Outlet } from '@tanstack/react-router'
import { useState } from 'react'
import { AppRail, ConnectionStatus, KeyboardLayer } from '@/features/navigation'
import { SearchPalette } from '@/features/search'
import { AppShell } from '@/templates'

export function ShellPage() {
  const [searchOpen, setSearchOpen] = useState(false)
  return (
    <AppShell
      rail={<AppRail onSearch={() => setSearchOpen(true)} />}
      statusBar={<ConnectionStatus />}
      overlays={
        <>
          <SearchPalette opened={searchOpen} onClose={() => setSearchOpen(false)} />
          <KeyboardLayer />
        </>
      }
    >
      <Outlet />
    </AppShell>
  )
}
