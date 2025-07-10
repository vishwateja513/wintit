import React, { useState } from 'react'
import { Download, Filter, Calendar, BarChart3, TrendingUp } from 'lucide-react'

const ReportsView: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    startDate: '2024-01-01',
    endDate: '2024-01-31'
  })
  
  const [filters, setFilters] = useState({
    category: 'all',
    region: 'all',
    status: 'all'
  })

  const reportData = {
    summary: {
      totalAudits: 156,
      completedAudits: 128,
      averageScore: 82.5,
      complianceRate: 78.2
    },
    categories: [
      { name: 'Merchandising', audits: 45, avgScore: 85.2, compliance: 82.1 },
      { name: 'Quality Control', audits: 38, avgScore: 79.8, compliance: 75.3 },
      { name: 'Competitor Analysis', audits: 42, avgScore: 81.5, compliance: 77.8 },
      { name: 'Stock Management', audits: 31, avgScore: 86.1, compliance: 84.6 }
    ],
    regions: [
      { name: 'Downtown', audits: 42, avgScore: 84.3, compliance: 80.5 },
      { name: 'Uptown', audits: 38, avgScore: 81.7, compliance: 76.8 },
      { name: 'Midtown', audits: 35, avgScore: 83.2, compliance: 78.9 },
      { name: 'Westside', audits: 41, avgScore: 80.8, compliance: 75.2 }
    ],
    timeline: [
      { date: '2024-01-01', audits: 12, avgScore: 78.5 },
      { date: '2024-01-08', audits: 15, avgScore: 82.3 },
      { date: '2024-01-15', audits: 18, avgScore: 85.1 },
      { date: '2024-01-22', audits: 14, avgScore: 81.7 },
      { date: '2024-01-29', audits: 16, avgScore: 83.9 }
    ]
  }

  const handleExportReport = (format: 'pdf' | 'excel' | 'csv') => {
    console.log(`Exporting report in ${format} format...`)
    // Export logic here
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
        <p className="text-gray-600 mt-1">Analyze your retail execution performance</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="merchandising">Merchandising</option>
                <option value="quality">Quality Control</option>
                <option value="competitor">Competitor Analysis</option>
                <option value="stock">Stock Management</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Region
              </label>
              <select
                value={filters.region}
                onChange={(e) => setFilters({...filters, region: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Regions</option>
                <option value="downtown">Downtown</option>
                <option value="uptown">Uptown</option>
                <option value="midtown">Midtown</option>
                <option value="westside">Westside</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
              </select>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleExportReport('pdf')}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2 inline" />
              Export PDF
            </button>
            <button
              onClick={() => handleExportReport('excel')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2 inline" />
              Export Excel
            </button>
            <button
              onClick={() => handleExportReport('csv')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2 inline" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Audits</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.summary.totalAudits}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{reportData.summary.completedAudits}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-blue-600">{reportData.summary.averageScore}%</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Compliance Rate</p>
              <p className="text-2xl font-bold text-purple-600">{reportData.summary.complianceRate}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Performance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Performance by Category</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {reportData.categories.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{category.name}</span>
                      <span className="text-sm text-gray-500">{category.audits} audits</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${category.compliance}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">Compliance: {category.compliance}%</span>
                      <span className="text-xs text-gray-500">Avg Score: {category.avgScore}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Regional Performance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Performance by Region</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {reportData.regions.map((region, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{region.name}</span>
                      <span className="text-sm text-gray-500">{region.audits} audits</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${region.compliance}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">Compliance: {region.compliance}%</span>
                      <span className="text-xs text-gray-500">Avg Score: {region.avgScore}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="mt-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Audit Timeline</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {reportData.timeline.map((point, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(point.date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">{point.audits} audits completed</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">{point.avgScore}%</p>
                    <p className="text-sm text-gray-500">Average Score</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportsView