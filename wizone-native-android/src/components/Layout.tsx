import React, { ReactNode } from 'react'
import { BottomNavigation } from './BottomNavigation'
import { TopBar } from './TopBar'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-background">
      <TopBar />
      <main className="flex-1 overflow-y-auto safe-area-left safe-area-right">
        {children}
      </main>
      <BottomNavigation />
    </div>
  )
}