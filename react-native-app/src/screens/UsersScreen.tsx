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
  Avatar,
  Searchbar,
  FAB,
  ActivityIndicator,
  Chip,
  Badge,
} from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, endpoints } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

export default function UsersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { user: currentUser } = useAuth();

  const {
    data: users,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiRequest(endpoints.users),
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return '#ef4444';
      case 'manager':
        return '#f59e0b';
      case 'engineer':
        return '#0891b2';
      case 'field_engineer':
        return '#22c55e';
      default:
        return '#64748b';
    }
  };

  const getDepartmentIcon = (department: string) => {
    switch (department.toLowerCase()) {
      case 'it support':
      case 'wizone help desk':
        return '💻';
      case 'field operations':
        return '🔧';
      case 'customer service':
        return '📞';
      case 'management':
        return '👔';
      default:
        return '👤';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const filteredUsers = users?.filter((user: User) => {
    return user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           user.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           user.department?.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  const renderUser = ({ item }: { item: User }) => (
    <Card style={styles.userCard}>
      <Card.Content>
        <View style={styles.userHeader}>
          <View style={styles.avatarContainer}>
            <Avatar.Text
              size={60}
              label={`${item.firstName?.charAt(0) || ''}${item.lastName?.charAt(0) || ''}`}
              style={{ backgroundColor: getRoleColor(item.role) }}
            />
            {!item.isActive && (
              <Badge style={styles.inactiveBadge} size={12} />
            )}
          </View>
          
          <View style={styles.userInfo}>
            <Title style={styles.userName}>
              {item.firstName} {item.lastName}
            </Title>
            <Paragraph style={styles.username}>@{item.username}</Paragraph>
            
            <View style={styles.chipContainer}>
              <Chip
                style={[
                  styles.roleChip,
                  { backgroundColor: getRoleColor(item.role) },
                ]}
                textStyle={{ color: 'white', fontSize: 12 }}
              >
                {item.role.replace('_', ' ').toUpperCase()}
              </Chip>
              <Chip
                style={styles.statusChip}
                textStyle={{ 
                  color: item.isActive ? '#22c55e' : '#ef4444',
                  fontSize: 12 
                }}
              >
                {item.isActive ? 'ACTIVE' : 'INACTIVE'}
              </Chip>
            </View>
          </View>
        </View>
        
        <View style={styles.userDetails}>
          <Paragraph style={styles.detailRow}>
            {getDepartmentIcon(item.department)} {item.department || 'No Department'}
          </Paragraph>
          <Paragraph style={styles.detailRow}>
            📧 {item.email || 'No email provided'}
          </Paragraph>
          <Paragraph style={styles.detailRow}>
            📱 {item.phone || 'No phone provided'}
          </Paragraph>
          <Paragraph style={styles.detailRow}>
            📅 Joined: {formatDate(item.createdAt)}
          </Paragraph>
          {currentUser?.id === item.id && (
            <Chip
              style={styles.currentUserChip}
              textStyle={{ color: '#0891b2', fontSize: 12, fontWeight: 'bold' }}
            >
              YOU
            </Chip>
          )}
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
          placeholder="Search users..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {currentUser?.role === 'admin' && (
        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => {
            // Navigate to create user screen
          }}
        />
      )}
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
    padding: 16,
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  searchbar: {
    elevation: 0,
  },
  listContent: {
    padding: 16,
  },
  userCard: {
    marginBottom: 16,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  inactiveBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  roleChip: {
    marginBottom: 4,
  },
  statusChip: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  userDetails: {
    gap: 8,
  },
  detailRow: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  currentUserChip: {
    backgroundColor: 'rgba(8, 145, 178, 0.1)',
    borderWidth: 1,
    borderColor: '#0891b2',
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#0891b2',
  },
});