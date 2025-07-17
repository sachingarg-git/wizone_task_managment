import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Avatar,
  Searchbar,
  FAB,
  ActivityIndicator,
  IconButton,
  Chip,
} from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, endpoints } from '../services/api';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  contactPerson: string;
  address: string;
  serviceType: string;
  status: string;
  createdAt: string;
  lastContactDate: string;
}

export default function CustomersScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: customers,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['customers'],
    queryFn: () => apiRequest(endpoints.customers),
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleCall = (phoneNumber: string) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert('No Phone Number', 'Phone number not available for this customer.');
    }
  };

  const handleEmail = (email: string) => {
    if (email) {
      Linking.openURL(`mailto:${email}`);
    } else {
      Alert.alert('No Email', 'Email address not available for this customer.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return '#22c55e';
      case 'inactive':
        return '#ef4444';
      case 'pending':
        return '#f59e0b';
      default:
        return '#64748b';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const filteredCustomers = customers?.filter((customer: Customer) => {
    return customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
           customer.contactPerson.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  const renderCustomer = ({ item }: { item: Customer }) => (
    <Card style={styles.customerCard}>
      <Card.Content>
        <View style={styles.customerHeader}>
          <Avatar.Text
            size={50}
            label={item.name.charAt(0).toUpperCase()}
            style={{ backgroundColor: '#0891b2' }}
          />
          <View style={styles.customerInfo}>
            <Title style={styles.customerName}>{item.name}</Title>
            <Paragraph style={styles.contactPerson}>
              Contact: {item.contactPerson || 'N/A'}
            </Paragraph>
            <Chip
              style={[
                styles.statusChip,
                { backgroundColor: getStatusColor(item.status) },
              ]}
              textStyle={{ color: 'white', fontSize: 12 }}
            >
              {item.status.toUpperCase()}
            </Chip>
          </View>
          <View style={styles.actionButtons}>
            <IconButton
              icon="phone"
              size={24}
              iconColor="#22c55e"
              onPress={() => handleCall(item.phone)}
            />
            <IconButton
              icon="email"
              size={24}
              iconColor="#0891b2"
              onPress={() => handleEmail(item.email)}
            />
          </View>
        </View>
        
        <View style={styles.customerDetails}>
          <Paragraph style={styles.detailRow}>
            📧 {item.email || 'No email provided'}
          </Paragraph>
          <Paragraph style={styles.detailRow}>
            📱 {item.phone || 'No phone provided'}
          </Paragraph>
          <Paragraph style={styles.detailRow}>
            🏢 {item.serviceType || 'Standard Service'}
          </Paragraph>
          <Paragraph style={styles.detailRow}>
            📍 {item.address || 'No address provided'}
          </Paragraph>
          <Paragraph style={styles.detailRow}>
            📅 Created: {formatDate(item.createdAt)}
          </Paragraph>
          <Paragraph style={styles.detailRow}>
            🕒 Last Contact: {formatDate(item.lastContactDate)}
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
          placeholder="Search customers..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      <FlatList
        data={filteredCustomers}
        renderItem={renderCustomer}
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
          // Navigate to create customer screen
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
  customerCard: {
    marginBottom: 16,
    elevation: 2,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  customerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  contactPerson: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  actionButtons: {
    alignItems: 'center',
  },
  customerDetails: {
    gap: 8,
  },
  detailRow: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#0891b2',
  },
});