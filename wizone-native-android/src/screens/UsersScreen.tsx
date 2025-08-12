import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '../services/apiService'
import { 
  Search, 
  Mail, 
  Shield, 
  User,
  Plus,
  Settings
} from 'lucide-react'

interface User {
  id: string
  username: string
  email?: string
  firstName?: string
  lastName?: string
  role: 'admin' | 'manager' | 'engineer'
  status: 'active' | 'inactive'
  createdAt: string
  lastLogin?: string
}

export function UsersScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => apiService.getEntities('users'),
  })

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = selectedRole === 'all' || user.role === selectedRole
    return matchesSearch && matchesRole
  })

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-700 bg-red-50'
      case 'manager': return 'text-blue-700 bg-blue-50'
      case 'engineer': return 'text-green-700 bg-green-50'
      default: return 'text-gray-700 bg-gray-50'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield size={14} className="text-red-600" />
      case 'manager': return <Settings size={14} className="text-blue-600" />
      case 'engineer': return <User size={14} className="text-green-600" />
      default: return <User size={14} className="text-gray-600" />
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <button className="bg-primary text-primary-foreground p-2 rounded-lg">
            <Plus size={20} />
          </button>
        </div>
        
        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div className="flex space-x-2">
            <select 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="engineer">Engineer</option>
            </select>
            
            <div className="flex space-x-2">
              <div className="bg-blue-50 px-3 py-2 rounded-lg">
                <span className="text-sm text-blue-700 font-medium">
                  Total: {users.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl p-4 shadow-sm">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <User size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">
              {searchQuery ? 'No users found' : 'No users yet'}
            </p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {user.firstName?.[0] || user.username[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user.username}
                    </h3>
                    <p className="text-sm text-gray-600">@{user.username}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium flex items-center space-x-1 ${getRoleColor(user.role)}`}>
                    {getRoleIcon(user.role)}
                    <span>{user.role}</span>
                  </span>
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                    user.status === 'active' 
                      ? 'text-green-700 bg-green-50' 
                      : 'text-gray-700 bg-gray-50'
                  }`}>
                    {user.status}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                {user.email && (
                  <div className="flex items-center space-x-2">
                    <Mail size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-600">{user.email}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <User size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                {user.lastLogin && (
                  <div className="flex items-center space-x-2">
                    <Shield size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Last login: {new Date(user.lastLogin).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}