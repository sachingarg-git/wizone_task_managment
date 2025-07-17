import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Avatar,
  Button,
  List,
  Divider,
  Switch,
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

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

  const formatRole = (role: string) => {
    return role.replace('_', ' ').toUpperCase();
  };

  if (!user) return null;

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileContent}>
          <Avatar.Text
            size={80}
            label={`${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`}
            style={[styles.avatar, { backgroundColor: getRoleColor(user.role) }]}
          />
          <Title style={styles.name}>
            {user.firstName} {user.lastName}
          </Title>
          <Paragraph style={styles.username}>@{user.username}</Paragraph>
          <Paragraph style={styles.role}>{formatRole(user.role)}</Paragraph>
          <Paragraph style={styles.department}>{user.department}</Paragraph>
        </Card.Content>
      </Card>

      {/* Account Information */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Account Information</Title>
          <List.Item
            title="Email"
            description={user.email || 'No email provided'}
            left={() => <List.Icon icon="email" />}
          />
          <Divider />
          <List.Item
            title="Username"
            description={user.username}
            left={() => <List.Icon icon="account" />}
          />
          <Divider />
          <List.Item
            title="Role"
            description={formatRole(user.role)}
            left={() => <List.Icon icon="shield-account" />}
          />
          <Divider />
          <List.Item
            title="Department"
            description={user.department || 'No department assigned'}
            left={() => <List.Icon icon="office-building" />}
          />
        </Card.Content>
      </Card>

      {/* Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Settings</Title>
          <List.Item
            title="Push Notifications"
            description="Receive task and system notifications"
            left={() => <List.Icon icon="bell" />}
            right={() => (
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
              />
            )}
          />
          <Divider />
          <List.Item
            title="Dark Mode"
            description="Enable dark theme"
            left={() => <List.Icon icon="theme-light-dark" />}
            right={() => (
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
              />
            )}
          />
        </Card.Content>
      </Card>

      {/* App Information */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>App Information</Title>
          <List.Item
            title="App Version"
            description="1.0.0"
            left={() => <List.Icon icon="information" />}
          />
          <Divider />
          <List.Item
            title="Build Number"
            description="20240715001"
            left={() => <List.Icon icon="cog" />}
          />
          <Divider />
          <List.Item
            title="Last Updated"
            description="July 15, 2025"
            left={() => <List.Icon icon="update" />}
          />
        </Card.Content>
      </Card>

      {/* Actions */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Actions</Title>
          <Button
            mode="outlined"
            onPress={() => Alert.alert('Feature Coming Soon', 'Profile editing will be available in a future update.')}
            style={styles.actionButton}
            icon="account-edit"
          >
            Edit Profile
          </Button>
          <Button
            mode="outlined"
            onPress={() => Alert.alert('Feature Coming Soon', 'Password change will be available in a future update.')}
            style={styles.actionButton}
            icon="lock-reset"
          >
            Change Password
          </Button>
          <Button
            mode="contained"
            onPress={handleLogout}
            style={[styles.actionButton, styles.logoutButton]}
            icon="logout"
            buttonColor="#ef4444"
          >
            Logout
          </Button>
        </Card.Content>
      </Card>

      <View style={styles.footer}>
        <Paragraph style={styles.footerText}>
          Wizone IT Support Portal Mobile
        </Paragraph>
        <Paragraph style={styles.footerText}>
          © 2025 Wizone Technologies
        </Paragraph>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  profileCard: {
    margin: 16,
    elevation: 4,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 8,
  },
  role: {
    fontSize: 14,
    color: '#0891b2',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  department: {
    fontSize: 14,
    color: '#64748b',
  },
  card: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  actionButton: {
    marginVertical: 4,
  },
  logoutButton: {
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    padding: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
});