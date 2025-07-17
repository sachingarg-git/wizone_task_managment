import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  Avatar,
  Searchbar,
  FAB,
  ActivityIndicator,
  Menu,
  Button,
} from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, endpoints } from '../services/api';

interface Task {
  id: number;
  ticketNumber: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  customerName: string;
  assignedEngineer: string;
  createdAt: string;
  updatedAt: string;
}

export default function TasksScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const {
    data: tasks,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => apiRequest(endpoints.tasks),
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return '#22c55e';
      case 'in_progress':
        return '#f59e0b';
      case 'pending':
        return '#ef4444';
      case 'on_hold':
        return '#8b5cf6';
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredTasks = tasks?.filter((task: Task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || task.status.toLowerCase() === selectedFilter;
    
    return matchesSearch && matchesFilter;
  }) || [];

  const renderTask = ({ item }: { item: Task }) => (
    <Card style={styles.taskCard}>
      <Card.Content>
        <View style={styles.taskHeader}>
          <Avatar.Text
            size={40}
            label={item.ticketNumber.slice(-2)}
            style={{ backgroundColor: '#0891b2' }}
          />
          <View style={styles.taskInfo}>
            <Title style={styles.taskTitle}>{item.title}</Title>
            <Paragraph style={styles.ticketNumber}>{item.ticketNumber}</Paragraph>
          </View>
          <View style={styles.taskChips}>
            <Chip
              style={[
                styles.statusChip,
                { backgroundColor: getStatusColor(item.status) },
              ]}
              textStyle={{ color: 'white', fontSize: 10 }}
            >
              {item.status.replace('_', ' ').toUpperCase()}
            </Chip>
            <Chip
              style={[
                styles.priorityChip,
                { backgroundColor: getPriorityColor(item.priority) },
              ]}
              textStyle={{ color: 'white', fontSize: 10 }}
            >
              {item.priority.toUpperCase()}
            </Chip>
          </View>
        </View>
        
        <Paragraph style={styles.description} numberOfLines={2}>
          {item.description}
        </Paragraph>
        
        <View style={styles.taskFooter}>
          <Paragraph style={styles.customerName}>
            Customer: {item.customerName}
          </Paragraph>
          <Paragraph style={styles.assignedEngineer}>
            Assigned: {item.assignedEngineer || 'Unassigned'}
          </Paragraph>
          <Paragraph style={styles.date}>
            Created: {formatDate(item.createdAt)}
          </Paragraph>
        </View>
      </Card.Content>
    </Card>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0891b2" />
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
              style={styles.filterButton}
            >
              Filter
            </Button>
          }
        >
          <Menu.Item onPress={() => { setSelectedFilter('all'); setFilterVisible(false); }} title="All Tasks" />
          <Menu.Item onPress={() => { setSelectedFilter('pending'); setFilterVisible(false); }} title="Pending" />
          <Menu.Item onPress={() => { setSelectedFilter('in_progress'); setFilterVisible(false); }} title="In Progress" />
          <Menu.Item onPress={() => { setSelectedFilter('completed'); setFilterVisible(false); }} title="Completed" />
          <Menu.Item onPress={() => { setSelectedFilter('on_hold'); setFilterVisible(false); }} title="On Hold" />
        </Menu>
      </View>

      <FlatList
        data={filteredTasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => {
          // Navigate to create task screen
        }}
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
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  searchbar: {
    flex: 1,
  },
  filterButton: {
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
  },
  taskCard: {
    marginBottom: 16,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskInfo: {
    flex: 1,
    marginLeft: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  ticketNumber: {
    fontSize: 14,
    color: '#64748b',
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
  description: {
    marginBottom: 12,
    color: '#475569',
  },
  taskFooter: {
    gap: 4,
  },
  customerName: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  assignedEngineer: {
    fontSize: 14,
    color: '#64748b',
  },
  date: {
    fontSize: 12,
    color: '#94a3b8',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#0891b2',
  },
});