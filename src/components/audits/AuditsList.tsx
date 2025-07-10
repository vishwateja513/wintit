import React, { useState } from 'react'
import { Play, Calendar, MapPin, User, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Audit } from '../../lib/supabase'
import AuditExecution from './AuditExecution'

const AuditsList: React.FC = () => {
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null)
  const [audits, setAudits] = useState<Audit[]>([
    {
      audit_id: '1',
      template_id: '1',
      status: 'pending',
      assigned_to: 'user1',
      location: {
        store_name: 'Metro Superstore - Downtown',
        address: '123 Main St, Downtown',
        coordinates: { lat: 40.7128, lng: -74.0060 }
      },
      responses: {},
      score: 0,
      created_at: '2024-01-20T09:00:00Z'
    },
    {
      audit_id: '2',
      template_id: '1',
      status: 'in_progress',
      assigned_to: 'user1',
      location: {
        store_name: 'Fresh Market - Uptown',
        address: '456 Oak Ave, Uptown',
        coordinates: { lat: 40.7589, lng: -73.9851 }
      },
      responses: {},
      score: 0,
      created_at: '2024-01-19T14:30:00Z'
    },
    {
      audit_id: '3',
      template_id: '2',
      status: 'completed',
      assigned_to: 'user1',
      location: {
        store_name: 'QuickMart - Midtown',
        address: '789 Pine St, Midtown',
        coordinates: { lat: 40.7505, lng: -73.9934 }
      },
      responses: {},
      score: 85,
      submitted_at: '2024-01-18T16:45:00Z',
      created_at: '2024-01-18T10:00:00Z'
    }
  ])

  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredAudits = audits.filter(audit => {
    const matchesStatus = filterStatus === 'all' || audit.status === filterStatus
    const matchesSearch = audit.location.store_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         audit.location.address?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'in_progress':
        return <AlertCircle className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const handleStartAudit = (audit: Audit) => {
    setSelectedAudit(audit)
    // Update audit status to in_progress
    setAudits(prev => prev.map(a => 
      a.audit_id === audit.audit_id 
        ? { ...a, status: 'in_progress' }
        : a
    ))
  }

  const handleCloseAudit = () => {
    setSelectedAudit(null)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Audits</h2>
        <p className="text-gray-600 mt-1">Manage your assigned audits</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by store name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="sm:w-48">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Audits List */}
      <div className="space-y-4">
        {filteredAudits.map((audit) => (
          <div key={audit.audit_id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {audit.location.store_name}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      {audit.location.address}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(audit.status)}`}>
                    {getStatusIcon(audit.status)}
                    <span className="ml-1 capitalize">{audit.status.replace('_', ' ')}</span>
                  </span>
                  {audit.status !== 'completed' && (
                    <button
                      onClick={() => handleStartAudit(audit)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Play className="h-4 w-4 mr-2 inline" />
                      {audit.status === 'pending' ? 'Start Audit' : 'Continue'}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center text-gray-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Created: {new Date(audit.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-gray-500">
                  <User className="h-4 w-4 mr-2" />
                  <span>Assigned to: You</span>
                </div>
                {audit.status === 'completed' && (
                  <div className="flex items-center text-gray-500">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>Score: {audit.score}%</span>
                  </div>
                )}
              </div>

              {audit.status === 'completed' && audit.submitted_at && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    ✅ Audit completed on {new Date(audit.submitted_at).toLocaleDateString()} at {new Date(audit.submitted_at).toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredAudits.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No audits found</h3>
          <p className="text-gray-500">
            {searchTerm || filterStatus !== 'all' 
              ? "No audits match your current filters." 
              : "You have no assigned audits at the moment."}
          </p>
        </div>
      )}

      {/* Audit Execution Modal */}
      {selectedAudit && (
        <AuditExecution
          audit={selectedAudit}
          onClose={handleCloseAudit}
        />
      )}
    </div>
  )
}

export default AuditsList