import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/DirectAuthContext'
import { 
  Home, 
  ClipboardList, 
  Users, 
  UserCheck, 
  User 
} from 'lucide-react'

export function BottomNavigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const tabs = [
    { 
      key: 'dashboard', 
      label: 'Dashboard', 
      icon: Home, 
      path: '/' 
    },
    { 
      key: 'tasks', 
      label: 'Tasks', 
      icon: ClipboardList, 
      path: '/tasks' 
    },
    { 
      key: 'customers', 
      label: 'Customers', 
      icon: Users, 
      path: '/customers' 
    },
    ...(user?.role === 'admin' ? [{ 
      key: 'users', 
      label: 'Users', 
      icon: UserCheck, 
      path: '/users' 
    }] : []),
    { 
      key: 'profile', 
      label: 'Profile', 
      icon: User, 
      path: '/profile' 
    },
  ]

  return (
    <nav className="bg-white border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = location.pathname === tab.path || 
                          (tab.path === '/' && location.pathname === '/dashboard')
          
          return (
            <button
              key={tab.key}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors min-w-[48px] ${
                isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-xs mt-1 font-medium ${isActive ? 'font-semibold' : ''}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}