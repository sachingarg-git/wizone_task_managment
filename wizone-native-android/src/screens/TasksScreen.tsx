import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '../services/apiService'
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Filter
} from 'lucide-react'

interface Task {
  id: string
  taskId: string
  customer: string
  assignedEngineer: string
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  estimatedDuration: string
  createdAt: string
  dueDate?: string
  description?: string
  location?: string
}

export function TasksScreen() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  
  const { data: tasks = [], isLoading, refetch } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: () => apiService.getEntities('tasks'),
  })

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus
    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority
    return matchesStatus && matchesPriority
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'text-red-600 bg-red-50'
      case 'High': return 'text-orange-600 bg-orange-50'
      case 'Medium': return 'text-yellow-600 bg-yellow-50'
      case 'Low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-green-600" />
      case 'in-progress': return <Clock size={16} className="text-blue-600" />
      case 'pending': return <AlertCircle size={16} className="text-orange-600" />
      default: return <Clock size={16} className="text-gray-600" />
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <button className="bg-primary text-primary-foreground p-2 rounded-lg">
            <Plus size={20} />
          </button>
        </div>
        
        {/* Filters */}
        <div className="flex space-x-2 overflow-x-auto">
          <button className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg whitespace-nowrap">
            <Filter size={16} />
            <span className="text-sm">Filter</span>
          </button>
          
          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          
          <select 
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Priority</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Task List */}
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
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No tasks found</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-900">#{task.taskId}</span>
                  {getStatusIcon(task.status)}
                </div>
                <span className={`px-2 py-1 rounded-md text-xs font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-600">{task.customer}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <User size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-600">{task.assignedEngineer}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-600">{task.estimatedDuration}</span>
                </div>
                
                {task.location && (
                  <div className="flex items-center space-x-2">
                    <MapPin size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-600">{task.location}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Calendar size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              {task.description && (
                <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100">
                  {task.description}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}