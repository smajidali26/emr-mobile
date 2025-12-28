/**
 * DemographicsSection Component
 * Displays patient demographics with SSN masking and biometric protection
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Card } from '../ui/Card';
import { PatientDemographics } from '../../types/patient.types';
import { biometricAuth } from '../../lib/storage/biometric-auth';
import { usePatientStore } from '../../stores/patient-store';
import { secureLogger } from '../../lib/utils/secure-logger';

interface DemographicsSectionProps {
  demographics: PatientDemographics;
  showEditButton?: boolean;
  onEdit?: () => void;
}

export const DemographicsSection: React.FC<DemographicsSectionProps> = ({
  demographics,
  showEditButton = false,
  onEdit,
}) => {
  const { showSensitiveData, toggleSensitiveData } = usePatientStore();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const maskSSN = (ssn: string) => {
    if (!ssn || ssn.length < 4) return '***-**-****';
    return `***-**-${ssn.slice(-4)}`;
  };

  const handleToggleSensitiveData = async () => {
    if (showSensitiveData) {
      // Hide sensitive data
      toggleSensitiveData(false);
      secureLogger.info('Sensitive data hidden');
      return;
    }

    // Show sensitive data - require biometric authentication
    setIsAuthenticating(true);

    try {
      const isAuthenticated = await biometricAuth.authenticate({
        promptMessage: 'Authenticate to view sensitive patient data',
        cancelLabel: 'Cancel',
      });

      if (isAuthenticated) {
        toggleSensitiveData(true);
        secureLogger.info('Sensitive data access granted');
      } else {
        Alert.alert(
          'Authentication Failed',
          'Biometric authentication is required to view sensitive data.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      secureLogger.error('Biometric authentication error:', error);
      Alert.alert(
        'Authentication Error',
        'An error occurred during authentication. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'male':
        return 'Male';
      case 'female':
        return 'Female';
      case 'other':
        return 'Other';
      default:
        return 'Unknown';
    }
  };

  const getMaritalStatusLabel = (status?: string) => {
    if (!status) return 'Not specified';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <Card variant="outlined" padding="md" style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Demographics</Text>
        {showEditButton && onEdit && (
          <TouchableOpacity onPress={onEdit} style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            <Text style={styles.value}>
              {demographics.firstName} {demographics.middleName ? `${demographics.middleName} ` : ''}
              {demographics.lastName}
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>Date of Birth</Text>
            <Text style={styles.value}>{formatDate(demographics.dateOfBirth)}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Gender</Text>
            <Text style={styles.value}>{getGenderLabel(demographics.gender)}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>SSN</Text>
            <View style={styles.ssnContainer}>
              <Text style={styles.value}>
                {showSensitiveData ? demographics.ssn : maskSSN(demographics.ssn)}
              </Text>
              <TouchableOpacity
                onPress={handleToggleSensitiveData}
                disabled={isAuthenticating}
                style={styles.ssnToggle}
              >
                <Text style={styles.ssnToggleText}>
                  {isAuthenticating ? 'Authenticating...' : showSensitiveData ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {demographics.bloodType && (
            <View style={styles.field}>
              <Text style={styles.label}>Blood Type</Text>
              <Text style={styles.value}>{demographics.bloodType}</Text>
            </View>
          )}
        </View>

        {demographics.maritalStatus && (
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>Marital Status</Text>
              <Text style={styles.value}>{getMaritalStatusLabel(demographics.maritalStatus)}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>

        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>Phone Number</Text>
            <Text style={styles.value}>{demographics.phoneNumber}</Text>
          </View>
        </View>

        {demographics.alternatePhoneNumber && (
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>Alternate Phone</Text>
              <Text style={styles.value}>{demographics.alternatePhoneNumber}</Text>
            </View>
          </View>
        )}

        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{demographics.email}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>Address</Text>
            <Text style={styles.value}>
              {demographics.address.street}
              {'\n'}
              {demographics.address.city}, {demographics.address.state} {demographics.address.zipCode}
              {'\n'}
              {demographics.address.country}
            </Text>
          </View>
        </View>
      </View>

      {(demographics.occupation || demographics.employer || demographics.preferredLanguage) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>

          {demographics.occupation && (
            <View style={styles.row}>
              <View style={styles.field}>
                <Text style={styles.label}>Occupation</Text>
                <Text style={styles.value}>{demographics.occupation}</Text>
              </View>
            </View>
          )}

          {demographics.employer && (
            <View style={styles.row}>
              <View style={styles.field}>
                <Text style={styles.label}>Employer</Text>
                <Text style={styles.value}>{demographics.employer}</Text>
              </View>
            </View>
          )}

          {demographics.preferredLanguage && (
            <View style={styles.row}>
              <View style={styles.field}>
                <Text style={styles.label}>Preferred Language</Text>
                <Text style={styles.value}>{demographics.preferredLanguage}</Text>
              </View>
            </View>
          )}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  field: {
    flex: 1,
    marginRight: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    color: '#1E293B',
    lineHeight: 22,
  },
  ssnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ssnToggle: {
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
  },
  ssnToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
});
