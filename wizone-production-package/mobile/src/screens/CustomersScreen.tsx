import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import {
  Card,
  Text,
  List,
  Searchbar,
  FAB,
  useTheme,
  ActivityIndicator,
  Button,
  IconButton,
} from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { customersApi } from '../utils/api';

interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  serviceType: string;
  status: string;
  createdAt: string;
}

function CustomerCard({ customer, onPress }: { customer: Customer; onPress?: () => void }) {
  const theme = useTheme();
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return '#16a34a';
      case 'inactive':
        return '#dc2626';
      case 'suspended':
        return '#ea580c';
      default:
        return theme.colors.onSurface;
    }
  };

  const handleCall = () => {
    if (customer.phone) {
      Linking.openURL(`tel:${customer.phone}`);
    }
  };

  const handleEmail = () => {
    if (customer.email) {
      Linking.openURL(`mailto:${customer.email}`);
    }
  };

  return (
    <Card style={styles.customerCard} onPress={onPress}>
      <Card.Content>
        <View style={styles.customerHeader}>
          <View style={styles.customerInfo}>
            <Text variant="titleMedium" style={styles.customerName}>
              {customer.firstName} {customer.lastName}
            </Text>
            {customer.company && (
              <Text variant="bodyMedium" style={styles.companyName}>
                {customer.company}
              </Text>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(customer.status)}15` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(customer.status) }]}>
              {customer.status}
            </Text>
          </View>
        </View>

        <View style={styles.contactInfo}>
          <View style={styles.contactItem}>
            <Icon name="email" size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={styles.contactText}>
              {customer.email}
            </Text>
          </View>
          {customer.phone && (
            <View style={styles.contactItem}>
              <Icon name="phone" size={16} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodySmall" style={styles.contactText}>
                {customer.phone}
              </Text>
            </View>
          )}
        </View>

        {customer.address && (
          <View style={styles.addressInfo}>
            <Icon name="map-marker" size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={styles.addressText}>
              {customer.address}
              {customer.city && `, ${customer.city}`}
              {customer.state && `, ${customer.state}`}
              {customer.zipCode && ` ${customer.zipCode}`}
            </Text>
          </View>
        )}

        <View style={styles.serviceInfo}>
          <Text variant="bodySmall" style={styles.serviceLabel}>
            Service Type:
          </Text>
          <Text variant="bodySmall" style={styles.serviceType}>
            {customer.serviceType}
          </Text>
        </View>

        <View style={styles.customerActions}>
          {customer.phone && (
            <IconButton
              icon="phone"
              size={20}
              onPress={handleCall}
              style={styles.actionButton}
            />
          )}
          <IconButton
            icon="email"
            size={20}
            onPress={handleEmail}
            style={styles.actionButton}
          />
        </View>
      </Card.Content>
    </Card>
  );
}

export default function CustomersScreen() {
  const theme = useTheme();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: customers,
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ['customers'],
    queryFn: customersApi.getAll,
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filteredCustomers = React.useMemo(() => {
    if (!customers) return [];
    
    if (!searchQuery.trim()) return customers;
    
    return customers.filter((customer: Customer) =>
      `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.company && customer.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (customer.phone && customer.phone.includes(searchQuery))
    );
  }, [customers, searchQuery]);

  const handleCustomerPress = (customer: Customer) => {
    Alert.alert(
      `${customer.firstName} ${customer.lastName}`,
      `${customer.company ? `${customer.company}\n` : ''}Email: ${customer.email}${customer.phone ? `\nPhone: ${customer.phone}` : ''}\nService: ${customer.serviceType}\nStatus: ${customer.status}`,
      [
        { text: 'Close', style: 'cancel' },
        { text: 'Call', onPress: () => customer.phone && Linking.openURL(`tel:${customer.phone}`) },
        { text: 'Email', onPress: () => Linking.openURL(`mailto:${customer.email}`) },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading customers...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={48} color={theme.colors.error} />
        <Text variant="titleMedium" style={styles.errorTitle}>
          Failed to load customers
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
          placeholder="Search customers..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      {searchQuery.trim() && (
        <View style={styles.searchResults}>
          <Text variant="bodySmall" style={styles.searchResultsText}>
            Showing {filteredCustomers.length} of {customers?.length || 0} customers
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.customersList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer: Customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onPress={() => handleCustomerPress(customer)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="account-group-outline" size={64} color={theme.colors.onSurfaceVariant} />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No customers found
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              {searchQuery.trim()
                ? 'Try adjusting your search query'
                : 'No customers have been added yet'
              }
            </Text>
          </View>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => Alert.alert('Info', 'Create customer feature coming soon!')}
        label="New Customer"
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
    padding: 16,
  },
  searchbar: {
    elevation: 2,
  },
  searchResults: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchResultsText: {
    color: '#64748b',
  },
  customersList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  customerCard: {
    marginBottom: 12,
    elevation: 2,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontWeight: 'bold',
    color: '#1e293b',
  },
  companyName: {
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  contactInfo: {
    marginBottom: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactText: {
    color: '#475569',
    marginLeft: 8,
    flex: 1,
  },
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  addressText: {
    color: '#475569',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceLabel: {
    color: '#64748b',
    fontWeight: '500',
  },
  serviceType: {
    color: '#1e293b',
    marginLeft: 8,
    fontWeight: '600',
  },
  customerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    margin: 0,
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