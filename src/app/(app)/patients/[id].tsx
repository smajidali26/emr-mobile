/**
 * Patient Detail Screen
 * Displays detailed patient information
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Card } from '../../../components/ui/Card';
import { DemographicsSection } from '../../../components/patients/DemographicsSection';
import { usePatient, useDeletePatient } from '../../../lib/api/patient-api';
import { usePatientStore } from '../../../stores/patient-store';
import { biometricAuth } from '../../../lib/storage/biometric-auth';
import { secureLogger } from '../../../lib/utils/secure-logger';

export default function PatientDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { setSelectedPatient } = usePatientStore();
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch patient data
  const {
    data: patient,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = usePatient(id);

  const deletePatientMutation = useDeletePatient();

  // Update selected patient in store
  useEffect(() => {
    if (patient) {
      setSelectedPatient(patient);
    }

    return () => {
      setSelectedPatient(null);
    };
  }, [patient, setSelectedPatient]);

  const handleEdit = () => {
    router.push(`/(app)/patients/edit/${id}`);
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Patient',
      'Are you sure you want to delete this patient record? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    // SECURITY: Require biometric confirmation before deleting patient
    setIsDeleting(true);

    try {
      // SECURITY FIX: Check biometric availability before attempting authentication (Assigned: Steven Perez)
      const isAvailable = await biometricAuth.isAvailable();
      if (!isAvailable) {
        Alert.alert(
          'Biometric Not Available',
          'This device does not support biometric authentication. Patient deletion requires biometric verification for security compliance.',
          [{ text: 'OK' }]
        );
        setIsDeleting(false);
        return;
      }

      const isAuthenticated = await biometricAuth.authenticate({
        promptMessage: 'Authenticate to delete patient record',
        cancelLabel: 'Cancel',
      });

      if (!isAuthenticated) {
        Alert.alert(
          'Authentication Required',
          'Biometric authentication is required to delete patient records.',
          [{ text: 'OK' }]
        );
        setIsDeleting(false);
        return;
      }
    } catch (error) {
      secureLogger.error('Biometric authentication error:', error);
      Alert.alert(
        'Authentication Error',
        'An error occurred during authentication. Please try again.',
        [{ text: 'OK' }]
      );
      setIsDeleting(false);
      return;
    }

    // Delete patient
    deletePatientMutation.mutate(id, {
      onSuccess: () => {
        secureLogger.info(`Patient deleted: ${id}`);
        Alert.alert(
          'Patient Deleted',
          'Patient record has been deleted successfully.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(app)/patients'),
            },
          ]
        );
      },
      onError: (error) => {
        secureLogger.error('Failed to delete patient:', error);
        Alert.alert(
          'Delete Failed',
          'Failed to delete patient record. Please try again.',
          [{ text: 'OK' }]
        );
        setIsDeleting(false);
      },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'inactive':
        return '#6B7280';
      case 'deceased':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading patient...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !patient) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error Loading Patient</Text>
          <Text style={styles.errorText}>
            Unable to load patient information. Please try again.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#2563EB"
          />
        }
      >
        {/* Patient Header */}
        <Card variant="elevated" padding="lg" style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>
                {patient.demographics.firstName} {patient.demographics.lastName}
              </Text>
              <Text style={styles.mrn}>MRN: {patient.mrn}</Text>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(patient.status) }]}>
              <Text style={styles.statusText}>
                {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Registered</Text>
              <Text style={styles.metaValue}>{formatDate(patient.registrationDate)}</Text>
            </View>

            {patient.lastVisitDate && (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Last Visit</Text>
                <Text style={styles.metaValue}>{formatDate(patient.lastVisitDate)}</Text>
              </View>
            )}

            {patient.primaryCareProvider && (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Primary Care</Text>
                <Text style={styles.metaValue}>{patient.primaryCareProvider}</Text>
              </View>
            )}
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEdit}
              activeOpacity={0.7}
            >
              <Text style={styles.editButtonText}>Edit Patient</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              activeOpacity={0.7}
              disabled={isDeleting}
            >
              <Text style={styles.deleteButtonText}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Demographics Section */}
        <DemographicsSection
          demographics={patient.demographics}
          showEditButton={false}
        />

        {/* Emergency Contacts */}
        {patient.emergencyContacts && patient.emergencyContacts.length > 0 && (
          <Card variant="outlined" padding="md" style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>

            {patient.emergencyContacts.map((contact, index) => (
              <View key={contact.id || index} style={styles.contactCard}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactRelationship}>{contact.relationship}</Text>
                <Text style={styles.contactPhone}>{contact.phoneNumber}</Text>
                {contact.email && (
                  <Text style={styles.contactEmail}>{contact.email}</Text>
                )}
              </View>
            ))}
          </Card>
        )}

        {/* Insurance Information */}
        {patient.insurance && patient.insurance.length > 0 && (
          <Card variant="outlined" padding="md" style={styles.section}>
            <Text style={styles.sectionTitle}>Insurance Information</Text>

            {patient.insurance.map((insurance, index) => (
              <View key={insurance.id || index} style={styles.insuranceCard}>
                <View style={styles.insuranceHeader}>
                  <Text style={styles.insuranceProvider}>{insurance.provider}</Text>
                  {insurance.isPrimary && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>Primary</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.insuranceDetail}>
                  Policy: {insurance.policyNumber}
                </Text>
                {insurance.groupNumber && (
                  <Text style={styles.insuranceDetail}>
                    Group: {insurance.groupNumber}
                  </Text>
                )}
                <Text style={styles.insuranceDetail}>
                  Subscriber: {insurance.subscriberName}
                </Text>
                <Text style={styles.insuranceDetail}>
                  Effective: {formatDate(insurance.effectiveDate)}
                </Text>
              </View>
            ))}
          </Card>
        )}

        {/* Notes */}
        {patient.notes && (
          <Card variant="outlined" padding="md" style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{patient.notes}</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
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
    marginBottom: 12,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563EB',
  },
  headerCard: {
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  mrn: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  metaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  metaItem: {
    marginRight: 24,
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  contactCard: {
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginBottom: 12,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  contactRelationship: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  contactPhone: {
    fontSize: 14,
    color: '#1E293B',
  },
  contactEmail: {
    fontSize: 14,
    color: '#2563EB',
    marginTop: 4,
  },
  insuranceCard: {
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginBottom: 12,
  },
  insuranceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insuranceProvider: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  primaryBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  primaryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  insuranceDetail: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 22,
  },
});
