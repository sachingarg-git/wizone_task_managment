/**
 * Portal Screen for Task Score Tracker Mobile
 * This is a simplified version focused on essential functionality
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';

const API_BASE_URL = 'http://192.168.11.9:3001/api';

const PortalScreen = () => {
  const [tasks, setTasks] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('tasks');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch tasks
      const tasksResponse = await fetch(`${API_BASE_URL}/tasks`);
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setTasks(tasksData);
      }

      // Fetch customers
      const customersResponse = await fetch(`${API_BASE_URL}/customers`);
      if (customersResponse.ok) {
        const customersData = await customersResponse.json();
        setCustomers(customersData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data. Make sure server is running on 192.168.11.9:3001');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const renderTaskCard = (task, index) => (
    <View key={task.id || index} style={styles.card}>
      <Text style={styles.cardTitle}>{task.title || 'No Title'}</Text>
      <Text style={styles.cardSubtitle}>{task.description || 'No Description'}</Text>
      <View style={styles.cardFooter}>
        <Text style={[styles.status, { color: getStatusColor(task.status) }]}>
          {task.status || 'unknown'}
        </Text>
        <Text style={styles.customer}>👤 {task.customerName || 'Unknown'}</Text>
      </View>
    </View>
  );

  const renderCustomerCard = (customer, index) => (
    <View key={customer.id || index} style={styles.card}>
      <Text style={styles.cardTitle}>{customer.name || 'No Name'}</Text>
      <Text style={styles.cardSubtitle}>{customer.company || 'No Company'}</Text>
      <Text style={styles.contact}>📧 {customer.email || 'No Email'}</Text>
      <Text style={styles.contact}>📞 {customer.mobilePhone || 'No Phone'}</Text>
    </View>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in-progress': return '#f59e0b';
      case 'pending': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Task Score Tracker</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'tasks' && styles.activeTab]}
          onPress={() => setSelectedTab('tasks')}
        >
          <Text style={[styles.tabText, selectedTab === 'tasks' && styles.activeTabText]}>
            Tasks ({tasks.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'customers' && styles.activeTab]}
          onPress={() => setSelectedTab('customers')}
        >
          <Text style={[styles.tabText, selectedTab === 'customers' && styles.activeTabText]}>
            Customers ({customers.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0891b2" />
            <Text style={styles.loadingText}>Loading data...</Text>
          </View>
        )}

        {!loading && selectedTab === 'tasks' && (
          <View>
            <Text style={styles.sectionTitle}>Tasks</Text>
            {tasks.length === 0 ? (
              <Text style={styles.emptyText}>No tasks found</Text>
            ) : (
              tasks.map(renderTaskCard)
            )}
          </View>
        )}

        {!loading && selectedTab === 'customers' && (
          <View>
            <Text style={styles.sectionTitle}>Customers</Text>
            {customers.length === 0 ? (
              <Text style={styles.emptyText}>No customers found</Text>
            ) : (
              customers.map(renderCustomerCard)
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#0891b2',
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#0891b2',
  },
  tabText: {
    fontSize: 16,
    color: '#64748b',
  },
  activeTabText: {
    color: '#0891b2',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    color: '#64748b',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1e293b',
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 16,
    marginTop: 50,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  customer: {
    fontSize: 12,
    color: '#64748b',
  },
  contact: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
});

export default PortalScreen;