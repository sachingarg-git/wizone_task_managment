import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  List,
  Avatar,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, endpoints } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalCustomers: number;
  activeEngineers: number;
}

interface RecentTask {
  id: number;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string;
  customerName: string;
  assignedEngineer: string;
  createdAt: string;
}

export default function DashboardScreen() {
  const { user } = useAuth();

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => apiRequest(endpoints.dashboardStats),
  });

  const {
    data: recentTasks,
    isLoading: tasksLoading,
    refetch: refetchTasks,
  } = useQuery({
    queryKey: ['recentTasks'],
    queryFn: () => apiRequest(endpoints.recentTasks),
  });

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchTasks()]);
    setRefreshing(false);
  }, [refetchStats, refetchTasks]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return '#22c55e';
      case 'in_progress':
        return '#f59e0b';
      case 'pending':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#22c55e';
      default:
        return '#64748b';
    }
  };

  if (statsLoading || tasksLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0891b2" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Title style={styles.welcomeText}>
          Welcome back, {user?.firstName || user?.username}!
        </Title>
        <Paragraph style={styles.roleText}>
          {user?.role} - {user?.department}
        </Paragraph>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Title style={[styles.statNumber, { color: '#0891b2' }]}>
              {stats?.totalTasks || 0}
            </Title>
            <Paragraph style={styles.statLabel}>Total Tasks</Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Title style={[styles.statNumber, { color: '#22c55e' }]}>
              {stats?.completedTasks || 0}
            </Title>
            <Paragraph style={styles.statLabel}>Completed</Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Title style={[styles.statNumber, { color: '#f59e0b' }]}>
              {stats?.pendingTasks || 0}
            </Title>
            <Paragraph style={styles.statLabel}>Pending</Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Title style={[styles.statNumber, { color: '#8b5cf6' }]}>
              {stats?.totalCustomers || 0}
            </Title>
            <Paragraph style={styles.statLabel}>Customers</Paragraph>
          </Card.Content>
        </Card>
      </View>

      {/* Recent Tasks */}
      <Card style={styles.recentTasksCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Recent Tasks</Title>
          {recentTasks && recentTasks.length > 0 ? (
            recentTasks.slice(0, 5).map((task: RecentTask) => (
              <List.Item
                key={task.id}
                title={task.title}
                description={`${task.ticketNumber} • ${task.customerName}`}
                left={() => (
                  <Avatar.Text
                    size={40}
                    label={task.ticketNumber.slice(-2)}
                    style={{ backgroundColor: '#0891b2' }}
                  />
                )}
                right={() => (
                  <View style={styles.taskChips}>
                    <Chip
                      style={[
                        styles.statusChip,
                        { backgroundColor: getStatusColor(task.status) },
                      ]}
                      textStyle={{ color: 'white', fontSize: 10 }}
                    >
                      {task.status.replace('_', ' ').toUpperCase()}
                    </Chip>
                    <Chip
                      style={[
                        styles.priorityChip,
                        { backgroundColor: getPriorityColor(task.priority) },
                      ]}
                      textStyle={{ color: 'white', fontSize: 10 }}
                    >
                      {task.priority.toUpperCase()}
                    </Chip>
                  </View>
                )}
              />
            ))
          ) : (
            <Paragraph style={styles.noDataText}>No recent tasks found</Paragraph>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#0891b2',
  },
  welcomeText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  roleText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    marginBottom: 16,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  recentTasksCard: {
    margin: 16,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 16,
    color: '#1e293b',
  },
  taskChips: {
    alignItems: 'flex-end',
  },
  statusChip: {
    marginBottom: 4,
    minWidth: 80,
  },
  priorityChip: {
    minWidth: 60,
  },
  noDataText: {
    textAlign: 'center',
    color: '#64748b',
    fontStyle: 'italic',
    marginVertical: 24,
  },
});