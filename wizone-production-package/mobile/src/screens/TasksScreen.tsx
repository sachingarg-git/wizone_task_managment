import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Card,
  Text,
  List,
  Chip,
  Searchbar,
  FAB,
  useTheme,
  ActivityIndicator,
  Menu,
  Button,
} from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { tasksApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface Task {
  id: number;
  ticketNumber: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    firstName: string;
    lastName: string;
    company: string;
  };
  assignedUser?: {
    firstName: string;
    lastName: string;
  };
  fieldEngineer?: {
    firstName: string;
    lastName: string;
  };
}

function TaskCard({ task, onPress }: { task: Task; onPress?: () => void }) {
  const theme = useTheme();
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return '#16a34a';
      case 'in progress':
        return '#ea580c';
      case 'pending':
        return '#dc2626';
      case 'assigned':
        return '#3b82f6';
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card style={styles.taskCard} onPress={onPress}>
      <Card.Content>
        <View style={styles.taskHeader}>
          <Text variant="titleMedium" style={styles.taskTitle}>
            {task.title}
          </Text>
          <Text variant="bodySmall" style={styles.ticketNumber}>
            {task.ticketNumber}
          </Text>
        </View>

        <Text variant="bodyMedium" style={styles.taskDescription} numberOfLines={2}>
          {task.description}
        </Text>

        <View style={styles.taskMeta}>
          <Text variant="bodySmall" style={styles.customerName}>
            {task.customer?.firstName} {task.customer?.lastName}
          </Text>
          {task.customer?.company && (
            <Text variant="bodySmall" style={styles.companyName}>
              • {task.customer.company}
            </Text>
          )}
        </View>

        {task.assignedUser && (
          <View style={styles.assignmentInfo}>
            <Icon name="account" size={14} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={styles.assignedTo}>
              Assigned: {task.assignedUser.firstName} {task.assignedUser.lastName}
            </Text>
          </View>
        )}

        {task.fieldEngineer && (
          <View style={styles.assignmentInfo}>
            <Icon name="account-hard-hat" size={14} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={styles.assignedTo}>
              Field Engineer: {task.fieldEngineer.firstName} {task.fieldEngineer.lastName}
            </Text>
          </View>
        )}

        <View style={styles.taskFooter}>
          <View style={styles.statusPriorityContainer}>
            <Chip
              mode="outlined"
              compact
              textStyle={{ fontSize: 11 }}
              style={[styles.statusChip, { borderColor: getStatusColor(task.status) }]}
            >
              {task.status}
            </Chip>
            <Chip
              mode="flat"
              compact
              textStyle={{ fontSize: 11, color: getPriorityColor(task.priority) }}
              style={[styles.priorityChip, { backgroundColor: `${getPriorityColor(task.priority)}15` }]}
            >
              {task.priority}
            </Chip>
          </View>
          <Text variant="bodySmall" style={styles.taskDate}>
            {formatDate(task.createdAt)}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

export default function TasksScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const {
    data: tasks,
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ['tasks', searchQuery, statusFilter, priorityFilter],
    queryFn: () => tasksApi.getAll(),
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filteredTasks = React.useMemo(() => {
    if (!tasks) return [];
    
    let filtered = tasks;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((task: Task) =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${task.customer?.firstName} ${task.customer?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((task: Task) => 
        task.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter((task: Task) => 
        task.priority.toLowerCase() === priorityFilter.toLowerCase()
      );
    }

    return filtered;
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  const handleTaskPress = (task: Task) => {
    Alert.alert(
      `Task: ${task.ticketNumber}`,
      `${task.title}\n\nStatus: ${task.status}\nPriority: ${task.priority}\n\nDescription:\n${task.description}`,
      [
        { text: 'Close', style: 'cancel' },
        { text: 'View Details', onPress: () => {
          // TODO: Navigate to task details screen
          Alert.alert('Info', 'Task details screen coming soon!');
        }},
      ]
    );
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setSearchQuery('');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={48} color={theme.colors.error} />
        <Text variant="titleMedium" style={styles.errorTitle}>
          Failed to load tasks
        </Text>
        <Text variant="bodyMedium" style={styles.errorText}>
          {error instanceof Error ? error.message : 'Unknown error occurred'}
        </Text>
        <Button mode="contained" onPress={() => refetch()} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search tasks..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        
        <Menu
          visible={filterVisible}
          onDismiss={() => setFilterVisible(false)}
          anchor={
            <Button 
              mode="outlined" 
              onPress={() => setFilterVisible(true)}
              compact
              style={styles.filterButton}
            >
              Filter
            </Button>
          }
        >
          <Menu.Item
            onPress={() => {
              setStatusFilter('all');
              setFilterVisible(false);
            }}
            title="All Status"
            leadingIcon={statusFilter === 'all' ? 'check' : undefined}
          />
          <Menu.Item
            onPress={() => {
              setStatusFilter('pending');
              setFilterVisible(false);
            }}
            title="Pending"
            leadingIcon={statusFilter === 'pending' ? 'check' : undefined}
          />
          <Menu.Item
            onPress={() => {
              setStatusFilter('in progress');
              setFilterVisible(false);
            }}
            title="In Progress"
            leadingIcon={statusFilter === 'in progress' ? 'check' : undefined}
          />
          <Menu.Item
            onPress={() => {
              setStatusFilter('completed');
              setFilterVisible(false);
            }}
            title="Completed"
            leadingIcon={statusFilter === 'completed' ? 'check' : undefined}
          />
        </Menu>
      </View>

      {(statusFilter !== 'all' || priorityFilter !== 'all' || searchQuery.trim()) && (
        <View style={styles.activeFilters}>
          <Text variant="bodySmall" style={styles.activeFiltersText}>
            Showing {filteredTasks.length} of {tasks?.length || 0} tasks
          </Text>
          <Button
            mode="text"
            compact
            onPress={clearFilters}
            labelStyle={styles.clearFiltersLabel}
          >
            Clear filters
          </Button>
        </View>
      )}

      <ScrollView
        style={styles.tasksList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task: Task) => (
            <TaskCard
              key={task.id}
              task={task}
              onPress={() => handleTaskPress(task)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="clipboard-outline" size={64} color={theme.colors.onSurfaceVariant} />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No tasks found
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              {searchQuery.trim() || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No tasks have been created yet'
              }
            </Text>
          </View>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => Alert.alert('Info', 'Create task feature coming soon!')}
        label="New Task"
      />
    </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  errorTitle: {
    marginTop: 16,
    color: '#dc2626',
  },
  errorText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#64748b',
  },
  retryButton: {
    marginTop: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  searchbar: {
    flex: 1,
    marginRight: 8,
  },
  filterButton: {
    minWidth: 70,
  },
  activeFilters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  activeFiltersText: {
    color: '#64748b',
  },
  clearFiltersLabel: {
    fontSize: 12,
  },
  tasksList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  taskCard: {
    marginBottom: 12,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    flex: 1,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  ticketNumber: {
    color: '#64748b',
    marginLeft: 8,
    fontFamily: 'monospace',
  },
  taskDescription: {
    color: '#475569',
    marginBottom: 8,
    lineHeight: 20,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    color: '#64748b',
    fontWeight: '500',
  },
  companyName: {
    color: '#94a3b8',
    marginLeft: 4,
  },
  assignmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  assignedTo: {
    color: '#64748b',
    marginLeft: 4,
    fontSize: 12,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statusPriorityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChip: {
    height: 28,
  },
  priorityChip: {
    height: 28,
  },
  taskDate: {
    color: '#94a3b8',
    fontSize: 11,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    marginTop: 16,
    color: '#64748b',
  },
  emptyText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#94a3b8',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});