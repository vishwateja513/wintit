import React from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  MapPin
} from 'lucide-react'

const Dashboard: React.FC = () => {
  // Sample data for dashboard
  const stats = {
    totalAudits: 156,
    completedAudits: 128,
    pendingAudits: 18,
    inProgressAudits: 10,
    averageScore: 82.5,
    totalTemplates: 12,
    activeUsers: 24
  }

  const recentAudits = [
    {
      id: '1',
      storeName: 'Metro Superstore - Downtown',
      status: 'completed',
      score: 85,
      date: '2024-01-20',
      auditor: 'John Smith'
    },
    {
      id: '2',
      storeName: 'Fresh Market - Uptown',
      status: 'in_progress',
      score: 0,
      date: '2024-01-20',
      auditor: 'Jane Doe'
    },
    {
      id: '3',
      storeName: 'QuickMart - Midtown',
      status: 'pending',
      score: 0,
      date: '2024-01-19',
      auditor: 'Mike Johnson'
    }
  ]

  const topPerformingStores = [
    { name: 'Metro Superstore - Downtown', score: 95, trend: 'up' },
    { name: 'Fresh Market - Uptown', score: 92, trend: 'up' },
    { name: 'QuickMart - Midtown', score: 88, trend: 'down' },
    { name: 'Corner Store - Westside', score: 85, trend: 'up' }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'in_progress':
        return <Clock className="h-4 w-4" />
      case 'pending':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm lg:text-base text-gray-600 mt-1">Welcome back! Here's your retail execution overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600">Total Audits</p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.totalAudits}</p>
            </div>
            <div className="p-2 lg:p-3 bg-blue-100 rounded-full">
              <FileText className="h-4 w-4 lg:h-6 lg:w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600">Completed</p>
              <p className="text-lg lg:text-2xl font-bold text-green-600">{stats.completedAudits}</p>
            </div>
            <div className="p-2 lg:p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-4 w-4 lg:h-6 lg:w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600">Pending</p>
              <p className="text-lg lg:text-2xl font-bold text-yellow-600">{stats.pendingAudits}</p>
            </div>
            <div className="p-2 lg:p-3 bg-yellow-100 rounded-full">
              <Clock className="h-4 w-4 lg:h-6 lg:w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-lg lg:text-2xl font-bold text-blue-600">{stats.averageScore}%</p>
            </div>
            <div className="p-2 lg:p-3 bg-blue-100 rounded-full">
              <BarChart3 className="h-4 w-4 lg:h-6 lg:w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Recent Audits */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 lg:p-6 border-b border-gray-200">
              <h3 className="text-base lg:text-lg font-semibold text-gray-900">Recent Audits</h3>
            </div>
            <div className="p-4 lg:p-6">
              <div className="space-y-4">
                {recentAudits.map((audit) => (
                  <div key={audit.id} className="flex items-center justify-between p-3 lg:p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-1.5 lg:p-2 bg-blue-100 rounded-full">
                        <MapPin className="h-3 w-3 lg:h-4 lg:w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-sm lg:text-base font-medium text-gray-900">{audit.storeName}</h4>
                        <p className="text-xs lg:text-sm text-gray-500">by {audit.auditor}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 lg:space-x-3">
                      <span className={`inline-flex items-center px-2 lg:px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(audit.status)}`}>
                        {getStatusIcon(audit.status)}
                        <span className="ml-1 capitalize hidden sm:inline">{audit.status.replace('_', ' ')}</span>
                      </span>
                      {audit.status === 'completed' && (
                        <span className="text-xs lg:text-sm font-medium text-gray-900">{audit.score}%</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top Performing Stores */}
        <div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 lg:p-6 border-b border-gray-200">
              <h3 className="text-base lg:text-lg font-semibold text-gray-900">Top Performing</h3>
            </div>
            <div className="p-4 lg:p-6">
              <div className="space-y-4">
                {topPerformingStores.map((store, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 lg:space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-xs lg:text-sm">{store.name}</p>
                        <p className="text-xs text-gray-500">{store.score}%</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className={`h-3 w-3 lg:h-4 lg:w-4 ${
                        store.trend === 'up' ? 'text-green-500' : 'text-red-500'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 lg:mt-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <h3 className="text-base lg:text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-4 lg:p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <button className="flex flex-col lg:flex-row items-center justify-center p-3 lg:p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                <FileText className="h-5 w-5 text-blue-600 mb-1 lg:mb-0 lg:mr-2" />
                <span className="text-blue-600 font-medium text-xs lg:text-sm">Create Template</span>
              </button>
              <button className="flex flex-col lg:flex-row items-center justify-center p-3 lg:p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                <CheckCircle className="h-5 w-5 text-green-600 mb-1 lg:mb-0 lg:mr-2" />
                <span className="text-green-600 font-medium text-xs lg:text-sm">Start Audit</span>
              </button>
              <button className="flex flex-col lg:flex-row items-center justify-center p-3 lg:p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
                <BarChart3 className="h-5 w-5 text-purple-600 mb-1 lg:mb-0 lg:mr-2" />
                <span className="text-purple-600 font-medium text-xs lg:text-sm">View Reports</span>
              </button>
              <button className="flex flex-col lg:flex-row items-center justify-center p-3 lg:p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors">
                <Users className="h-5 w-5 text-orange-600 mb-1 lg:mb-0 lg:mr-2" />
                <span className="text-orange-600 font-medium text-xs lg:text-sm">Manage Users</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard