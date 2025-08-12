import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '../services/apiService'
import { useAuth } from '../context/AuthContext'
import { 
  BarChart3, 
  CheckCircle, 
  Clock, 
  Users, 
  AlertTriangle,
  TrendingUp 
} from 'lucide-react'

interface DashboardStats {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  totalCustomers: number
  activeUsers: number
  completionRate: number
}

export function DashboardScreen() {
  const { user } = useAuth()
  
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => apiService.getDashboardStats(),
  })

  const statCards = [
    {
      title: 'Total Tasks',
      value: stats?.totalTasks || 0,
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Completed',
      value: stats?.completedTasks || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Pending',
      value: stats?.pendingTasks || 0,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Customers',
      value: stats?.totalCustomers || 0,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ]

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.firstName || user?.username}!
        </h2>
        <p className="text-gray-600">
          Here's what's happening with your tasks today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.title} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon size={20} className={card.color} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? '...' : card.value}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Performance Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <TrendingUp size={20} className="text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Completion Rate</span>
              <span className="font-medium">
                {isLoading ? '...' : `${stats?.completionRate || 0}%`}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${stats?.completionRate || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-700 p-3 rounded-lg transition-colors">
            <BarChart3 size={20} />
            <span className="font-medium">View Tasks</span>
          </button>
          <button className="flex items-center justify-center space-x-2 bg-green-50 hover:bg-green-100 text-green-700 p-3 rounded-lg transition-colors">
            <Users size={20} />
            <span className="font-medium">Customers</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle size={48} className="mx-auto mb-2 text-gray-300" />
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}