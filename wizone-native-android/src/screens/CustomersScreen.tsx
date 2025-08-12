import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '../services/apiService'
import { 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Building,
  Plus,
  Filter
} from 'lucide-react'

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  company?: string
  status: 'active' | 'inactive'
  createdAt: string
}

export function CustomersScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  
  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: () => apiService.getEntities('customers'),
  })

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.company?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <button className="bg-primary text-primary-foreground p-2 rounded-lg">
            <Plus size={20} />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        
        {/* Stats */}
        <div className="flex space-x-4">
          <div className="bg-blue-50 px-3 py-2 rounded-lg">
            <span className="text-sm text-blue-700 font-medium">
              Total: {customers.length}
            </span>
          </div>
          <div className="bg-green-50 px-3 py-2 rounded-lg">
            <span className="text-sm text-green-700 font-medium">
              Active: {customers.filter(c => c.status === 'active').length}
            </span>
          </div>
        </div>
      </div>

      {/* Customer List */}
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
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <Building size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">
              {searchQuery ? 'No customers found' : 'No customers yet'}
            </p>
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <div key={customer.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                  {customer.company && (
                    <p className="text-sm text-gray-600">{customer.company}</p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                  customer.status === 'active' 
                    ? 'text-green-700 bg-green-50' 
                    : 'text-gray-700 bg-gray-50'
                }`}>
                  {customer.status}
                </span>
              </div>
              
              <div className="space-y-2">
                {customer.email && (
                  <div className="flex items-center space-x-2">
                    <Mail size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-600">{customer.email}</span>
                  </div>
                )}
                
                {customer.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-600">{customer.phone}</span>
                  </div>
                )}
                
                {customer.address && (
                  <div className="flex items-center space-x-2">
                    <MapPin size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-600">{customer.address}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Building size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Member since {new Date(customer.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}