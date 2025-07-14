import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Text,
  List,
  Chip,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { dashboardApi, tasksApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  avgPerformanceScore: number;
  avgResponseTime: number;
  totalCustomers: number;
  activeUsers: number;
}

interface Task {
  id: number;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  customer?: {
    firstName: string;
    lastName: string;
  };
}

function StatCard({ title, value, icon, color }: {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}) {
  return (
    <Card style={styles.statCard}>
      <Card.Content style={styles.statCardContent}>
        <View style={styles.statHeader}>
          <Icon name={icon} size={24} color={color} />
          <Text variant="bodySmall" style={styles.statTitle}>
            {title}
          </Text>
        </View>
        <Text variant="headlineMedium" style={[styles.statValue, { color }]}>
          {value}
        </Text>
      </Card.Content>
    </Card>
  );
}

function TaskItem({ task }: { task: Task }) {
  const theme = useTheme();
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return '#16a34a';
      case 'in progress':
        return '#ea580c';
      case 'pending':
        return '#dc2626';
      default:
        return theme.colors.onSurface;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return '#dc2626';
      case 'medium':
        return '#ea580c';
      case 'low':
        return '#16a34a';
      default:
        return theme.colors.onSurface;
    }
  };

  return (
    <List.Item
      title={task.title}
      description={`${task.ticketNumber} • ${task.customer?.firstName} ${task.customer?.lastName}`}
      left={(props) => (
        <List.Icon
          {...props}
          icon="clipboard-text-outline"
          color={theme.colors.primary}
        />
      )}
      right={() => (
        <View style={styles.taskItemRight}>
          <Chip
            mode="outlined"
            compact
            textStyle={{ fontSize: 10 }}
            style={[styles.statusChip, { borderColor: getStatusColor(task.status) }]}
          >
            {task.status}
          </Chip>
          <Chip
            mode="flat"
            compact
            textStyle={{ fontSize: 10, color: getPriorityColor(task.priority) }}
            style={[styles.priorityChip, { backgroundColor: `${getPriorityColor(task.priority)}15` }]}
          >
            {task.priority}
          </Chip>
        </View>
      )}
      style={styles.taskItem}
    />
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const theme = useTheme();

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  const {
    data: recentTasks,
    isLoading: tasksLoading,
    refetch: refetchTasks,
  } = useQuery({
    queryKey: ['dashboard-recent-tasks'],
    queryFn: dashboardApi.getRecentTasks,
  });

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchTasks()]);
    setRefreshing(false);
  }, [refetchStats, refetchTasks]);

  const dashboardStats: DashboardStats = stats || {
    totalTasks: 0,
    completedTasks: 0,
    avgPerformanceScore: 0,
    avgResponseTime: 0,
    totalCustomers: 0,
    activeUsers: 0,
  };

  const tasks: Task[] = recentTasks || [];

  if (statsLoading && tasksLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
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
        <Text variant="headlineMedium" style={styles.welcomeText}>
          Welcome back, {user?.firstName}!
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} Dashboard
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <StatCard
            title="Total Tasks"
            value={dashboardStats.totalTasks}
            icon="clipboard-list"
            color="#3b82f6"
          />
          <StatCard
            title="Completed"
            value={dashboardStats.completedTasks}
            icon="check-circle"
            color="#16a34a"
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            title="Performance"
            value={`${dashboardStats.avgPerformanceScore.toFixed(1)}%`}
            icon="chart-line"
            color="#ea580c"
          />
          <StatCard
            title="Avg Response"
            value={`${dashboardStats.avgResponseTime.toFixed(1)}h`}
            icon="clock-outline"
            color="#7c3aed"
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            title="Customers"
            value={dashboardStats.totalCustomers}
            icon="account-group"
            color="#dc2626"
          />
          <StatCard
            title="Active Users"
            value={dashboardStats.activeUsers}
            icon="account-multiple"
            color="#059669"
          />
        </View>
      </View>

      <Card style={styles.recentTasksCard}>
        <Card.Title
          title="Recent Tasks"
          subtitle={`${tasks.length} tasks`}
          left={(props) => <Icon {...props} name="clock-outline" size={24} />}
        />
        <Card.Content>
          {tasks.length > 0 ? (
            tasks.slice(0, 5).map((task) => (
              <TaskItem key={task.id} task={task} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="clipboard-outline" size={48} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodyMedium" style={styles.emptyText}>
                No recent tasks found
              </Text>
            </View>
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
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    color: '#64748b',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  welcomeText: {
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    color: '#64748b',
    marginTop: 4,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    marginRight: 6,
    marginLeft: 6,
    elevation: 2,
  },
  statCardContent: {
    paddingVertical: 16,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    marginLeft: 8,
    color: '#64748b',
    fontSize: 12,
  },
  statValue: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  recentTasksCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
  },
  taskItem: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
  },
  taskItemRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  statusChip: {
    marginBottom: 4,
    height: 24,
  },
  priorityChip: {
    height: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 8,
    color: '#64748b',
  },
});