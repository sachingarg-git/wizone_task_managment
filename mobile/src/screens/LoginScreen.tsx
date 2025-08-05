import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const [username, setUsername] = useState('admin'); // Pre-fill for testing
  const [password, setPassword] = useState('admin123'); // Pre-fill for testing
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const theme = useTheme();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 Mobile APK login screen - attempting login for:', username.trim());
      await login(username.trim(), password);
      console.log('✅ Mobile APK login screen - login successful');
      // Navigation will be handled automatically by AuthContext
    } catch (error) {
      console.error('❌ Mobile APK login screen - login failed:', error);
      Alert.alert(
        'Login Failed',
        error instanceof Error ? error.message : 'Please check your credentials and try again'
      );
    } finally {
      setLoading(false);
    }
  };



  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <View style={[styles.logoPlaceholder, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.logoText}>WIZONE</Text>
          </View>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            IT Support Portal
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Mobile Access
          </Text>
        </View>

        <Card style={styles.loginCard}>
          <Card.Content style={styles.cardContent}>
            <Text variant="headlineSmall" style={styles.loginTitle}>
              Sign In
            </Text>

            <TextInput
              label="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              left={<TextInput.Icon icon="account" />}
              style={styles.input}
              disabled={loading}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              style={styles.input}
              disabled={loading}
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.loginButton}
              contentStyle={styles.loginButtonContent}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>


          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Text variant="bodySmall" style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>
            Wizone IT Support Portal v1.0
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  loginCard: {
    marginBottom: 20,
    elevation: 4,
  },
  cardContent: {
    padding: 24,
  },
  loginTitle: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 12,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  demoButton: {
    marginBottom: 20,
  },
  credentialsInfo: {
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  credentialsText: {
    color: '#475569',
    marginBottom: 2,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    opacity: 0.6,
  },
});