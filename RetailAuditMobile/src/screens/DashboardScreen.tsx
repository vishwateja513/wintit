import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'
import { fetchAudits, Audit } from '../lib/supabase'

const DashboardScreen: React.FC = () => {
  const { user, signOut } = useAuth()
  const [audits, setAudits] = useState<Audit[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadAudits = async () => {
    if (!user) return

    try {
      const { data, error } = await fetchAudits(user.id)
      if (error) {
        console.error('Error fetching audits:', error)
      } else {
        setAudits(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadAudits()
  }, [user])

  const onRefresh = () => {
    setRefreshing(true)
    loadAudits()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B'
      case 'in_progress':
        return '#3B82F6'
      case 'completed':
        return '#10B981'
      default:
        return '#6B7280'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'time-outline'
      case 'in_progress':
        return 'play-circle-outline'
      case 'completed':
        return 'checkmark-circle-outline'
      default:
        return 'help-circle-outline'
    }
  }

  const stats = {
    total: audits.length,
    pending: audits.filter(a => a.status === 'pending').length,
    inProgress: audits.filter(a => a.status === 'in_progress').length,
    completed: audits.filter(a => a.status === 'completed').length,
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.userName}>{user?.user_metadata?.name || user?.email}</Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Audits</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#3B82F6' }]}>{stats.inProgress}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#10B981' }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Audits</Text>
        {audits.slice(0, 5).map((audit) => (
          <View key={audit.audit_id} style={styles.auditCard}>
            <View style={styles.auditHeader}>
              <View style={styles.auditInfo}>
                <Text style={styles.auditTitle}>
                  {audit.location.store_name || 'Unknown Store'}
                </Text>
                <Text style={styles.auditAddress}>
                  {audit.location.address || 'No address'}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(audit.status) }]}>
                <Ionicons
                  name={getStatusIcon(audit.status) as any}
                  size={16}
                  color="white"
                />
                <Text style={styles.statusText}>
                  {audit.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.auditFooter}>
              <Text style={styles.auditDate}>
                Created: {new Date(audit.created_at).toLocaleDateString()}
              </Text>
              {audit.status === 'completed' && (
                <Text style={styles.auditScore}>Score: {audit.score}%</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="add-circle-outline" size={32} color="#3B82F6" />
            <Text style={styles.actionText}>Start New Audit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="camera-outline" size={32} color="#10B981" />
            <Text style={styles.actionText}>Quick Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="location-outline" size={32} color="#F59E0B" />
            <Text style={styles.actionText}>Find Stores</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="bar-chart-outline" size={32} color="#8B5CF6" />
            <Text style={styles.actionText}>View Reports</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  auditCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  auditInfo: {
    flex: 1,
  },
  auditTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  auditAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  auditFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  auditDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  auditScore: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  quickActions: {
    padding: 20,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    fontSize: 14,
    color: '#1F2937',
    marginTop: 8,
    textAlign: 'center',
  },
})

export default DashboardScreen