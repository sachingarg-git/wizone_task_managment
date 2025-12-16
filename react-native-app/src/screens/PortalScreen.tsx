import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Text as RNText,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  ActivityIndicator,
  Avatar,
  Chip,
  Surface,
  Text,
  Appbar,
} from 'react-native-paper';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { API_CONFIG, getApiUrl, API_ENDPOINTS } from '../config/api';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignedTo: string;
  customerName: string;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
}

const PortalScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'tasks' | 'customers'>('dashboard');
  const queryClient = useQueryClient();

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await axios.get(getApiUrl(API_ENDPOINTS.DASHBOARD_STATS));
      return response.data;
    },
    retry: 2,
  });

  // Fetch tasks
  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await axios.get(getApiUrl(API_ENDPOINTS.TASKS));
      return response.data;
    },
    retry: 2,
  });

  // Fetch customers
  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await axios.get(getApiUrl(API_ENDPOINTS.CUSTOMERS));
      return response.data;
    },
    retry: 2,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'in-progress':
        return '#f59e0b';
      case 'pending':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const renderDashboard = () => (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Avatar.Icon size={50} icon="account-circle" style={styles.avatar} />
        <View style={styles.headerText}>
          <Title style={styles.welcomeText}>Welcome to Portal</Title>
          <Paragraph style={styles.subText}>Task Score Tracker</Paragraph>
        </View>
      </View>

      {statsLoading ? (
        <ActivityIndicator size="large" color="#0891b2" style={styles.loader} />
      ) : (
        <View style={styles.statsGrid}>
          <Surface style={[styles.statCard, { backgroundColor: '#dbeafe' }]}>
            <Icon name="assignment" size={24} color="#2563eb" />
            <Text style={styles.statNumber}>{stats?.totalTasks || 0}</Text>
            <Text style={styles.statLabel}>Total Tasks</Text>
          </Surface>
          
          <Surface style={[styles.statCard, { backgroundColor: '#dcfce7' }]}>
            <Icon name="check-circle" size={24} color="#16a34a" />
            <Text style={styles.statNumber}>{stats?.completedTasks || 0}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </Surface>
          
          <Surface style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
            <Icon name="schedule" size={24} color="#d97706" />
            <Text style={styles.statNumber}>{stats?.inProgressTasks || 0}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </Surface>
          
          <Surface style={[styles.statCard, { backgroundColor: '#fee2e2' }]}>
            <Icon name="pending" size={24} color="#dc2626" />
            <Text style={styles.statNumber}>{stats?.pendingTasks || 0}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </Surface>
        </View>
      )}

      <Title style={styles.sectionTitle}>Recent Tasks</Title>
      {tasksLoading ? (
        <ActivityIndicator size="large" color="#0891b2" />
      ) : (
        <View>
          {tasks?.slice(0, 3).map((task) => (
            <Card key={task.id} style={styles.taskCard}>
              <Card.Content>
                <View style={styles.taskHeader}>
                  <Title numberOfLines={1} style={styles.taskTitle}>{task.title}</Title>
                  <Chip 
                    mode="outlined" 
                    textStyle={{ color: getStatusColor(task.status) }}
                    style={{ borderColor: getStatusColor(task.status) }}
                  >
                    {task.status}
                  </Chip>
                </View>
                <Paragraph numberOfLines={2} style={styles.taskDescription}>
                  {task.description}
                </Paragraph>
                <View style={styles.taskFooter}>
                  <Text style={styles.customerName}>👤 {task.customerName}</Text>
                  <Chip 
                    mode="flat"
                    textStyle={{ color: getPriorityColor(task.priority) }}
                    style={{ backgroundColor: getPriorityColor(task.priority) + '20' }}
                  >
                    {task.priority}
                  </Chip>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderTasks = () => (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Title style={styles.sectionTitle}>All Tasks</Title>
      {tasksLoading ? (
        <ActivityIndicator size="large" color="#0891b2" />
      ) : (
        <View>
          {tasks?.map((task) => (
            <Card key={task.id} style={styles.taskCard}>
              <Card.Content>
                <View style={styles.taskHeader}>
                  <Title numberOfLines={1} style={styles.taskTitle}>{task.title}</Title>
                  <Chip 
                    mode="outlined" 
                    textStyle={{ color: getStatusColor(task.status) }}
                    style={{ borderColor: getStatusColor(task.status) }}
                  >
                    {task.status}
                  </Chip>
                </View>
                <Paragraph style={styles.taskDescription}>
                  {task.description}
                </Paragraph>
                <View style={styles.taskFooter}>
                  <Text style={styles.customerName}>👤 {task.customerName}</Text>
                  <View style={styles.taskMeta}>
                    <Chip 
                      mode="flat"
                      textStyle={{ color: getPriorityColor(task.priority) }}
                      style={{ backgroundColor: getPriorityColor(task.priority) + '20' }}
                    >
                      {task.priority}
                    </Chip>
                    <Text style={styles.assignedTo}>📋 {task.assignedTo}</Text>
                  </View>
                </View>
              </Card.Content>
              <Card.Actions>
                <Button mode="outlined" compact onPress={() => Alert.alert('View Task', `Task: ${task.title}`)}>
                  View
                </Button>
                <Button mode="contained" compact onPress={() => Alert.alert('Edit Task', `Edit: ${task.title}`)}>
                  Edit
                </Button>
              </Card.Actions>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderCustomers = () => (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Title style={styles.sectionTitle}>Customers</Title>
      {customersLoading ? (
        <ActivityIndicator size="large" color="#0891b2" />
      ) : (
        <View>
          {customers?.map((customer) => (
            <Card key={customer.id} style={styles.customerCard}>
              <Card.Content>
                <View style={styles.customerHeader}>
                  <Avatar.Text size={40} label={customer.name.substring(0, 2).toUpperCase()} />
                  <View style={styles.customerInfo}>
                    <Title style={styles.customerName}>{customer.name}</Title>
                    <Paragraph style={styles.customerCompany}>{customer.company}</Paragraph>
                  </View>
                  <Chip mode="outlined">{customer.status}</Chip>
                </View>
                <View style={styles.customerDetails}>
                  <Text style={styles.contactInfo}>📧 {customer.email}</Text>
                  <Text style={styles.contactInfo}>📞 {customer.phone}</Text>
                </View>
              </Card.Content>
              <Card.Actions>
                <Button mode="outlined" compact onPress={() => Alert.alert('Contact', `Contact: ${customer.name}`)}>
                  Contact
                </Button>
                <Button mode="contained" compact onPress={() => Alert.alert('View Profile', `Profile: ${customer.name}`)}>
                  View
                </Button>
              </Card.Actions>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.mainContainer}>
      <Appbar.Header style={styles.appBar}>
        <Appbar.Content title="Task Portal" />
        <Appbar.Action icon="refresh" onPress={onRefresh} />
      </Appbar.Header>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'dashboard' && styles.activeTab]}
          onPress={() => setSelectedTab('dashboard')}
        >
          <Icon name="dashboard" size={20} color={selectedTab === 'dashboard' ? '#0891b2' : '#64748b'} />
          <Text style={[styles.tabText, selectedTab === 'dashboard' && styles.activeTabText]}>Dashboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'tasks' && styles.activeTab]}
          onPress={() => setSelectedTab('tasks')}
        >
          <Icon name="assignment" size={20} color={selectedTab === 'tasks' ? '#0891b2' : '#64748b'} />
          <Text style={[styles.tabText, selectedTab === 'tasks' && styles.activeTabText]}>Tasks</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'customers' && styles.activeTab]}
          onPress={() => setSelectedTab('customers')}
        >
          <Icon name="people" size={20} color={selectedTab === 'customers' ? '#0891b2' : '#64748b'} />
          <Text style={[styles.tabText, selectedTab === 'customers' && styles.activeTabText]}>Customers</Text>
        </TouchableOpacity>
      </View>

      {selectedTab === 'dashboard' && renderDashboard()}
      {selectedTab === 'tasks' && renderTasks()}
      {selectedTab === 'customers' && renderCustomers()}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  appBar: {
    backgroundColor: '#0891b2',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
  },
  avatar: {
    backgroundColor: '#0891b2',
    marginRight: 15,
  },
  headerText: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subText: {
    color: '#64748b',
    fontSize: 14,
  },
  loader: {
    marginVertical: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 15,
    color: '#1e293b',
  },
  taskCard: {
    marginBottom: 12,
    elevation: 2,
    backgroundColor: '#ffffff',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    flex: 1,
    marginRight: 10,
  },
  taskDescription: {
    color: '#64748b',
    marginBottom: 12,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  customerName: {
    fontSize: 14,
    color: '#64748b',
  },
  assignedTo: {
    fontSize: 12,
    color: '#64748b',
  },
  customerCard: {
    marginBottom: 12,
    elevation: 2,
    backgroundColor: '#ffffff',
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  customerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  customerCompany: {
    color: '#64748b',
    fontSize: 14,
  },
  customerDetails: {
    marginTop: 8,
  },
  contactInfo: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#0891b2',
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#64748b',
  },
  activeTabText: {
    color: '#0891b2',
    fontWeight: 'bold',
  },
});

export default PortalScreen;