import React from 'react'
import { useAuth } from '../context/SimpleAuthContext'
import { Search, Bell, Menu } from 'lucide-react'

export function TopBar() {
  const { user } = useAuth()

  return (
    <header className="bg-primary text-primary-foreground safe-area-top">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <button className="p-1 rounded-lg hover:bg-white/10 transition-colors">
            <Menu size={24} />
          </button>
          <div>
            <h1 className="text-lg font-semibold">Wizone</h1>
            <p className="text-xs text-primary-foreground/80">Field Engineer</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <Search size={20} />
          </button>
          <button className="p-2 rounded-lg hover:bg-white/10 transition-colors relative">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white">
              3
            </span>
          </button>
          
          {user && (
            <div className="flex items-center space-x-2 ml-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">
                  {user.firstName?.[0] || user.username[0].toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}