/**
 * Patients List Screen
 * Displays list of patients with search and filtering
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PatientCard } from '../../../components/patients/PatientCard';
import { PatientSearchInput } from '../../../components/patients/PatientSearchInput';
import { usePatients } from '../../../lib/api/patient-api';
import { usePatientStore } from '../../../stores/patient-store';
import { PatientListParams, PatientStatus, PatientSearchResult } from '../../../types/patient.types';
import { secureLogger } from '../../../lib/utils/secure-logger';

export default function PatientsListScreen() {
  const router = useRouter();
  const { addRecentPatient } = usePatientStore();

  // State
  const [params, setParams] = useState<PatientListParams>({
    page: 1,
    pageSize: 20,
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const [selectedStatus, setSelectedStatus] = useState<PatientStatus | 'all'>('all');

  // Fetch patients
  const {
    data: patientsData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = usePatients(params);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleStatusFilter = (status: PatientStatus | 'all') => {
    setSelectedStatus(status);
    setParams((prev) => ({
      ...prev,
      status: status === 'all' ? undefined : status,
      page: 1,
    }));
  };

  const handleSearchSelect = (patient: PatientSearchResult) => {
    addRecentPatient(patient);
    router.push(`/(app)/patients/${patient.id}`);
  };

  const handleNewPatient = () => {
    secureLogger.info('Navigating to new patient registration');
    router.push('/(app)/patients/new');
  };

  const handleLoadMore = () => {
    if (patientsData && patientsData.pagination.hasNext && !isLoading) {
      setParams((prev) => ({
        ...prev,
        page: prev.page! + 1,
      }));
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Patients</Text>
        <TouchableOpacity
          style={styles.newPatientButton}
          onPress={handleNewPatient}
          activeOpacity={0.7}
        >
          <Text style={styles.newPatientButtonText}>+ New Patient</Text>
        </TouchableOpacity>
      </View>

      <PatientSearchInput
        onSelectPatient={handleSearchSelect}
        placeholder="Search patients..."
      />

      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Status:</Text>
        <View style={styles.filterChips}>
          {(['all', 'active', 'inactive'] as const).map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                selectedStatus === status && styles.filterChipActive,
              ]}
              onPress={() => handleStatusFilter(status)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedStatus === status && styles.filterChipTextActive,
                ]}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {patientsData && (
        <Text style={styles.resultsCount}>
          {patientsData.pagination.totalItems} patient{patientsData.pagination.totalItems !== 1 ? 's' : ''}
        </Text>
      )}
    </View>
  );

  const renderPatient = ({ item }: { item: PatientSearchResult }) => (
    <PatientCard
      patient={item}
      onPress={() => {
        addRecentPatient(item);
        router.push(`/(app)/patients/${item.id}`);
      }}
    />
  );

  const renderFooter = () => {
    if (!patientsData?.pagination.hasNext) return null;

    return (
      <View style={styles.footer}>
        {isLoading && <ActivityIndicator size="small" color="#2563EB" />}
      </View>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No patients found</Text>
      <Text style={styles.emptyText}>
        {params.search
          ? 'Try adjusting your search criteria'
          : 'Get started by registering a new patient'}
      </Text>
      {!params.search && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={handleNewPatient}
        >
          <Text style={styles.emptyButtonText}>Register New Patient</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error Loading Patients</Text>
          <Text style={styles.errorText}>
            Unable to load patient list. Please try again.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={patientsData?.data || []}
        renderItem={renderPatient}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!isLoading ? renderEmptyList : null}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor="#2563EB"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  header: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  newPatientButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  newPatientButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 12,
  },
  filterChips: {
    flexDirection: 'row',
    flex: 1,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  filterChipActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  filterChipText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  resultsCount: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  emptyButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
