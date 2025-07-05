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
  Button,
  Menu,
} from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { usersApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  department?: string;
  createdAt: string;
  performanceMetrics?: Array<{
    completedTasks: number;
    avgResponseTime: number;
    performanceScore: number;
  }>;
}

function UserCard({ user, onPress }: { user: User; onPress?: () => void }) {
  const theme = useTheme();
  
  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return '#dc2626';
      case 'manager':
        return '#ea580c';
      case 'field engineer':
        return '#3b82f6';
      case 'backend engineer':
        return '#7c3aed';
      case 'engineer':
        return '#16a34a';
      default:
        return theme.colors.onSurface;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'shield-account';
      case 'manager':
        return 'account-tie';
      case 'field engineer':
        return 'account-hard-hat';
      case 'backend engineer':
        return 'laptop';
      default:
        return 'account';
    }
  };

  const performance = user.performanceMetrics?.[0];

  return (
    <Card style={styles.userCard} onPress={onPress}>
      <Card.Content>
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <Text variant="titleMedium" style={styles.userName}>
              {user.firstName} {user.lastName}
            </Text>
            <Text variant="bodySmall" style={styles.userEmail}>
              {user.email}
            </Text>
            {user.username && (
              <Text variant="bodySmall" style={styles.username}>
                @{user.username}
              </Text>
            )}
          </View>
          <Icon
            name={getRoleIcon(user.role)}
            size={32}
            color={getRoleColor(user.role)}
            style={styles.roleIcon}
          />
        </View>

        <View style={styles.roleContainer}>
          <Chip
            mode="flat"
            compact
            textStyle={{ fontSize: 11, color: getRoleColor(user.role) }}
            style={[styles.roleChip, { backgroundColor: `${getRoleColor(user.role)}15` }]}
          >
            {user.role}
          </Chip>
          {user.department && (
            <Text variant="bodySmall" style={styles.department}>
              {user.department}
            </Text>
          )}
        </View>

        {user.phone && (
          <View style={styles.contactInfo}>
            <Icon name="phone" size={14} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={styles.contactText}>
              {user.phone}
            </Text>
          </View>
        )}

        {performance && (
          <View style={styles.performanceInfo}>
            <Text variant="bodySmall" style={styles.performanceLabel}>
              Performance:
            </Text>
            <View style={styles.performanceMetrics}>
              <Text variant="bodySmall" style={styles.metric}>
                {performance.completedTasks} tasks
              </Text>
              <Text variant="bodySmall" style={styles.metric}>
                {performance.avgResponseTime.toFixed(1)}h avg
              </Text>
              <Text variant="bodySmall" style={[styles.metric, { color: getRoleColor(user.role) }]}>
                {performance.performanceScore.toFixed(1)}% score
              </Text>
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

export default function UsersScreen() {
  const { user: currentUser } = useAuth();
  const theme = useTheme();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');

  // Only allow admin users to see this screen
  if (currentUser?.role !== 'admin') {
    return (
      <View style={styles.restrictedContainer}>
        <Icon name="shield-lock" size={64} color={theme.colors.error} />
        <Text variant="titleMedium" style={styles.restrictedTitle}>
          Access Restricted
        </Text>
        <Text variant="bodyMedium" style={styles.restrictedText}>
          Only administrators can access user management
        </Text>
      </View>
    );
  }

  const {
    data: users,
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAll,
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filteredUsers = React.useMemo(() => {
    if (!users) return [];
    
    let filtered = users;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((user: User) =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user: User) => 
        user.role.toLowerCase() === roleFilter.toLowerCase()
      );
    }

    return filtered;
  }, [users, searchQuery, roleFilter]);

  const handleUserPress = (user: User) => {
    const performance = user.performanceMetrics?.[0];
    const performanceText = performance 
      ? `\n\nPerformance:\n- ${performance.completedTasks} completed tasks\n- ${performance.avgResponseTime.toFixed(1)}h average response time\n- ${performance.performanceScore.toFixed(1)}% performance score`
      : '';

    Alert.alert(
      `${user.firstName} ${user.lastName}`,
      `Role: ${user.role}${user.department ? `\nDepartment: ${user.department}` : ''}\nEmail: ${user.email}${user.phone ? `\nPhone: ${user.phone}` : ''}${user.username ? `\nUsername: ${user.username}` : ''}${performanceText}`,
      [
        { text: 'Close', style: 'cancel' },
        { text: 'Edit User', onPress: () => Alert.alert('Info', 'User editing feature coming soon!') },
      ]
    );
  };

  const clearFilters = () => {
    setRoleFilter('all');
    setSearchQuery('');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={48} color={theme.colors.error} />
        <Text variant="titleMedium" style={styles.errorTitle}>
          Failed to load users
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
          placeholder="Search users..."
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
              Role
            </Button>
          }
        >
          <Menu.Item
            onPress={() => {
              setRoleFilter('all');
              setFilterVisible(false);
            }}
            title="All Roles"
            leadingIcon={roleFilter === 'all' ? 'check' : undefined}
          />
          <Menu.Item
            onPress={() => {
              setRoleFilter('admin');
              setFilterVisible(false);
            }}
            title="Admin"
            leadingIcon={roleFilter === 'admin' ? 'check' : undefined}
          />
          <Menu.Item
            onPress={() => {
              setRoleFilter('manager');
              setFilterVisible(false);
            }}
            title="Manager"
            leadingIcon={roleFilter === 'manager' ? 'check' : undefined}
          />
          <Menu.Item
            onPress={() => {
              setRoleFilter('field engineer');
              setFilterVisible(false);
            }}
            title="Field Engineer"
            leadingIcon={roleFilter === 'field engineer' ? 'check' : undefined}
          />
          <Menu.Item
            onPress={() => {
              setRoleFilter('backend engineer');
              setFilterVisible(false);
            }}
            title="Backend Engineer"
            leadingIcon={roleFilter === 'backend engineer' ? 'check' : undefined}
          />
        </Menu>
      </View>

      {(roleFilter !== 'all' || searchQuery.trim()) && (
        <View style={styles.activeFilters}>
          <Text variant="bodySmall" style={styles.activeFiltersText}>
            Showing {filteredUsers.length} of {users?.length || 0} users
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
        style={styles.usersList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user: User) => (
            <UserCard
              key={user.id}
              user={user}
              onPress={() => handleUserPress(user)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="account-multiple-outline" size={64} color={theme.colors.onSurfaceVariant} />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No users found
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              {searchQuery.trim() || roleFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No users have been added yet'
              }
            </Text>
          </View>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => Alert.alert('Info', 'Create user feature coming soon!')}
        label="New User"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  restrictedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  restrictedTitle: {
    marginTop: 16,
    color: '#dc2626',
  },
  restrictedText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#64748b',
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
  usersList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  userCard: {
    marginBottom: 12,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    color: '#1e293b',
  },
  userEmail: {
    color: '#64748b',
    marginTop: 2,
  },
  username: {
    color: '#94a3b8',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  roleIcon: {
    marginLeft: 12,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleChip: {
    height: 28,
    marginRight: 8,
  },
  department: {
    color: '#64748b',
    fontStyle: 'italic',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    color: '#475569',
    marginLeft: 8,
  },
  performanceInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
  },
  performanceLabel: {
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  performanceMetrics: {
    flexDirection: 'row',
    gap: 12,
  },
  metric: {
    color: '#475569',
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