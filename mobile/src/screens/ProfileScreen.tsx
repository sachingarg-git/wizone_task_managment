import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Text,
  List,
  Button,
  useTheme,
  Dialog,
  Portal,
  Avatar,
  Divider,
  IconButton,
} from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { dashboardApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface UserStats {
  assignedTasks: number;
  completedTasks: number;
  pendingTasks: number;
  avgResponseTime: number;
  performanceScore: number;
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
          <Icon name={icon} size={20} color={color} />
          <Text variant="bodySmall" style={styles.statTitle}>
            {title}
          </Text>
        </View>
        <Text variant="titleLarge" style={[styles.statValue, { color }]}>
          {value}
        </Text>
      </Card.Content>
    </Card>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const theme = useTheme();
  
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);

  const {
    data: userStats,
  } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: () => dashboardApi.getStats(),
    enabled: !!user?.id,
  });

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
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
        return theme.colors.primary;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role?.toLowerCase()) {
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

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      Alert.alert('Error', 'Failed to logout. Please try again.');
    } finally {
      setLogoutDialogVisible(false);
    }
  };

  const handleEditProfile = () => {
    Alert.alert('Info', 'Profile editing feature coming soon!');
  };

  const handleChangePassword = () => {
    Alert.alert('Info', 'Password change feature coming soon!');
  };

  const handleSettings = () => {
    Alert.alert('Info', 'Settings feature coming soon!');
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  // Mock user stats for demo (replace with actual API data)
  const stats: UserStats = {
    assignedTasks: userStats?.totalTasks || 0,
    completedTasks: userStats?.completedTasks || 0,
    pendingTasks: (userStats?.totalTasks || 0) - (userStats?.completedTasks || 0),
    avgResponseTime: userStats?.avgResponseTime || 0,
    performanceScore: userStats?.avgPerformanceScore || 0,
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <Card style={styles.profileCard}>
        <Card.Content>
          <View style={styles.profileHeader}>
            <Avatar.Icon
              size={80}
              icon={getRoleIcon(user.role)}
              style={[styles.avatar, { backgroundColor: getRoleColor(user.role) }]}
            />
            <View style={styles.profileInfo}>
              <Text variant="headlineSmall" style={styles.userName}>
                {user.firstName} {user.lastName}
              </Text>
              <Text variant="titleMedium" style={[styles.userRole, { color: getRoleColor(user.role) }]}>
                {user.role}
              </Text>
              {user.department && (
                <Text variant="bodyMedium" style={styles.userDepartment}>
                  {user.department}
                </Text>
              )}
            </View>
            <IconButton
              icon="pencil"
              size={24}
              onPress={handleEditProfile}
              style={styles.editButton}
            />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <Icon name="email" size={16} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodyMedium" style={styles.contactText}>
                {user.email}
              </Text>
            </View>
            {user.username && (
              <View style={styles.contactItem}>
                <Icon name="account" size={16} color={theme.colors.onSurfaceVariant} />
                <Text variant="bodyMedium" style={styles.contactText}>
                  @{user.username}
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Performance Stats */}
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Performance Overview
      </Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <StatCard
            title="Assigned Tasks"
            value={stats.assignedTasks}
            icon="clipboard-list"
            color="#3b82f6"
          />
          <StatCard
            title="Completed"
            value={stats.completedTasks}
            icon="check-circle"
            color="#16a34a"
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            title="Pending"
            value={stats.pendingTasks}
            icon="clock-outline"
            color="#ea580c"
          />
          <StatCard
            title="Performance"
            value={`${stats.performanceScore.toFixed(1)}%`}
            icon="chart-line"
            color="#7c3aed"
          />
        </View>
      </View>

      {/* Quick Actions */}
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Account Settings
      </Text>

      <Card style={styles.actionsCard}>
        <List.Item
          title="Edit Profile"
          description="Update your personal information"
          left={(props) => <List.Icon {...props} icon="account-edit" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={handleEditProfile}
        />
        <Divider />
        <List.Item
          title="Change Password"
          description="Update your login password"
          left={(props) => <List.Icon {...props} icon="lock-reset" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={handleChangePassword}
        />
        <Divider />
        <List.Item
          title="Settings"
          description="App preferences and notifications"
          left={(props) => <List.Icon {...props} icon="cog" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={handleSettings}
        />
      </Card>

      {/* App Information */}
      <Text variant="titleMedium" style={styles.sectionTitle}>
        About
      </Text>

      <Card style={styles.infoCard}>
        <Card.Content>
          <View style={styles.infoItem}>
            <Text variant="bodyMedium" style={styles.infoLabel}>
              App Version
            </Text>
            <Text variant="bodyMedium" style={styles.infoValue}>
              1.0.0
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text variant="bodyMedium" style={styles.infoLabel}>
              Build
            </Text>
            <Text variant="bodyMedium" style={styles.infoValue}>
              Mobile v1.0
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text variant="bodyMedium" style={styles.infoLabel}>
              Platform
            </Text>
            <Text variant="bodyMedium" style={styles.infoValue}>
              Wizone IT Support Portal
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Logout Button */}
      <Button
        mode="contained"
        icon="logout"
        onPress={() => setLogoutDialogVisible(true)}
        style={styles.logoutButton}
        buttonColor={theme.colors.error}
      >
        Sign Out
      </Button>

      {/* Logout Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={logoutDialogVisible}
          onDismiss={() => setLogoutDialogVisible(false)}
        >
          <Dialog.Title>Sign Out</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to sign out of your account?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLogoutDialogVisible(false)}>
              Cancel
            </Button>
            <Button onPress={handleLogout} textColor={theme.colors.error}>
              Sign Out
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.footerText}>
          © 2025 Wizone IT Support Portal
        </Text>
      </View>
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
  profileCard: {
    margin: 16,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    color: '#1e293b',
  },
  userRole: {
    fontWeight: '600',
    marginTop: 2,
  },
  userDepartment: {
    color: '#64748b',
    marginTop: 2,
  },
  editButton: {
    margin: 0,
  },
  divider: {
    marginVertical: 8,
  },
  contactInfo: {
    marginTop: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    marginLeft: 12,
    color: '#475569',
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statsGrid: {
    paddingHorizontal: 16,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    elevation: 1,
  },
  statCardContent: {
    paddingVertical: 12,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    marginLeft: 8,
    color: '#64748b',
    fontSize: 11,
  },
  statValue: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  actionsCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    elevation: 1,
  },
  infoCard: {
    marginHorizontal: 16,
    elevation: 1,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    color: '#64748b',
  },
  infoValue: {
    color: '#1e293b',
    fontWeight: '500',
  },
  logoutButton: {
    margin: 16,
    marginTop: 24,
  },
  footer: {
    alignItems: 'center',
    padding: 24,
  },
  footerText: {
    color: '#94a3b8',
  },
});