import React from 'react'
import { useAuth } from '../context/DebugAuthContext'
import { 
  User, 
  Mail, 
  Shield, 
  LogOut, 
  Settings, 
  Bell,
  Moon,
  Sun,
  Globe
} from 'lucide-react'

export function ProfileScreen() {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      await logout()
    }
  }

  const menuItems = [
    {
      icon: Settings,
      title: 'Account Settings',
      subtitle: 'Manage your account preferences',
      action: () => console.log('Account Settings'),
    },
    {
      icon: Bell,
      title: 'Notifications',
      subtitle: 'Configure notification preferences',
      action: () => console.log('Notifications'),
    },
    {
      icon: Moon,
      title: 'Dark Mode',
      subtitle: 'Switch to dark theme',
      action: () => console.log('Dark Mode'),
    },
    {
      icon: Globe,
      title: 'Language',
      subtitle: 'Choose your language',
      action: () => console.log('Language'),
    },
  ]

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Profile Header */}
      <div className="bg-white p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xl font-bold">
              {user?.firstName?.[0] || user?.username[0].toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user?.username}
            </h2>
            <p className="text-gray-600">@{user?.username}</p>
          </div>
        </div>
        
        {/* User Info Cards */}
        <div className="space-y-3">
          {user?.email && (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Mail size={20} className="text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Email</p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Shield size={20} className="text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Role</p>
              <p className="text-sm text-gray-600 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 p-4 space-y-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon
          return (
            <button
              key={index}
              onClick={item.action}
              className="w-full bg-white p-4 rounded-xl shadow-sm flex items-center space-x-3 hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-gray-100 rounded-lg">
                <Icon size={20} className="text-gray-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900">{item.title}</p>
                <p className="text-sm text-gray-600">{item.subtitle}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Logout Button */}
      <div className="p-4">
        <button
          onClick={handleLogout}
          className="w-full bg-red-50 hover:bg-red-100 text-red-700 p-4 rounded-xl flex items-center justify-center space-x-2 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Log Out</span>
        </button>
      </div>

      {/* App Info */}
      <div className="p-4 text-center">
        <p className="text-xs text-gray-500">
          Wizone Field Engineer App v1.0.0
        </p>
        <p className="text-xs text-gray-400 mt-1">
          © 2024 Wizone IT Support
        </p>
      </div>
    </div>
  )
}