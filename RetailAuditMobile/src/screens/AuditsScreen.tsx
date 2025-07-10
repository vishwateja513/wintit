import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'
import { fetchAudits, Audit } from '../lib/supabase'

interface AuditsScreenProps {
  navigation: any
}

const AuditsScreen: React.FC<AuditsScreenProps> = ({ navigation }) => {
  const { user } = useAuth()
  const [audits, setAudits] = useState<Audit[]>([])
  const [filteredAudits, setFilteredAudits] = useState<Audit[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const loadAudits = async () => {
    if (!user) return

    try {
      const { data, error } = await fetchAudits(user.id)
      if (error) {
        console.error('Error fetching audits:', error)
      } else {
        setAudits(data || [])
        setFilteredAudits(data || [])
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

  useEffect(() => {
    filterAudits()
  }, [audits, searchQuery, statusFilter])

  const filterAudits = () => {
    let filtered = audits

    if (statusFilter !== 'all') {
      filtered = filtered.filter(audit => audit.status === statusFilter)
    }

    if (searchQuery) {
      filtered = filtered.filter(audit =>
        audit.location.store_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        audit.location.address?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredAudits(filtered)
  }

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

  const handleAuditPress = (audit: Audit) => {
    if (audit.status !== 'completed') {
      navigation.navigate('AuditExecution', { audit })
    } else {
      navigation.navigate('AuditDetails', { audit })
    }
  }

  const renderAuditItem = ({ item }: { item: Audit }) => (
    <TouchableOpacity
      style={styles.auditCard}
      onPress={() => handleAuditPress(item)}
    >
      <View style={styles.auditHeader}>
        <View style={styles.auditInfo}>
          <Text style={styles.auditTitle}>
            {item.location.store_name || 'Unknown Store'}
          </Text>
          <Text style={styles.auditAddress}>
            {item.location.address || 'No address'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Ionicons
            name={getStatusIcon(item.status) as any}
            size={16}
            color="white"
          />
          <Text style={styles.statusText}>
            {item.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.auditDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            Created: {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        {item.status === 'completed' && (
          <View style={styles.detailRow}>
            <Ionicons name="trophy-outline" size={16} color="#10B981" />
            <Text style={[styles.detailText, { color: '#10B981' }]}>
              Score: {item.score}%
            </Text>
          </View>
        )}
        {item.submitted_at && (
          <View style={styles.detailRow}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
            <Text style={styles.detailText}>
              Submitted: {new Date(item.submitted_at).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.auditFooter}>
        <Text style={styles.actionHint}>
          {item.status === 'pending' ? 'Tap to start audit' : 
           item.status === 'in_progress' ? 'Tap to continue' : 
           'Tap to view details'}
        </Text>
        <Ionicons name="chevron-forward-outline" size={20} color="#6B7280" />
      </View>
    </TouchableOpacity>
  )

  const statusOptions = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
  ]

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Audits</Text>
        <Text style={styles.subtitle}>Manage your assigned audits</Text>
      </View>

      <View style={styles.filters}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by store name or location..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.statusFilters}>
          {statusOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.statusFilter,
                statusFilter === option.value && styles.statusFilterActive
              ]}
              onPress={() => setStatusFilter(option.value)}
            >
              <Text style={[
                styles.statusFilterText,
                statusFilter === option.value && styles.statusFilterTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredAudits}
        renderItem={renderAuditItem}
        keyExtractor={(item) => item.audit_id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="clipboard-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No audits found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || statusFilter !== 'all'
                ? 'No audits match your current filters'
                : 'You have no assigned audits at the moment'}
            </Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  filters: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#1F2937',
  },
  statusFilters: {
    flexDirection: 'row',
    gap: 8,
  },
  statusFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  statusFilterActive: {
    backgroundColor: '#3B82F6',
  },
  statusFilterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusFilterTextActive: {
    color: 'white',
  },
  listContainer: {
    padding: 16,
  },
  auditCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
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
    fontSize: 18,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  auditDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  auditFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionHint: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
})

export default AuditsScreen