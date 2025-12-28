/**
 * Edit Patient Screen
 * Form for editing existing patient demographics
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { PatientForm } from '../../../../components/patients/PatientForm';
import { usePatient, useUpdatePatient } from '../../../../lib/api/patient-api';
import { biometricAuth } from '../../../../lib/storage/biometric-auth';
import { PatientDemographics } from '../../../../types/patient.types';
import { secureLogger } from '../../../../lib/utils/secure-logger';

export default function EditPatientScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Fetch patient data
  const { data: patient, isLoading, error } = usePatient(id);

  const updatePatientMutation = useUpdatePatient();

  const handleSubmit = async (demographics: PatientDemographics) => {
    // SECURITY: Require biometric confirmation before updating patient
    setIsAuthenticating(true);

    try {
      const isAuthenticated = await biometricAuth.authenticate({
        promptMessage: 'Authenticate to update patient information',
        cancelLabel: 'Cancel',
      });

      if (!isAuthenticated) {
        Alert.alert(
          'Authentication Required',
          'Biometric authentication is required to update patient information.',
          [{ text: 'OK' }]
        );
        setIsAuthenticating(false);
        return;
      }
    } catch (error) {
      secureLogger.error('Biometric authentication error:', error);
      Alert.alert(
        'Authentication Error',
        'An error occurred during authentication. Please try again.',
        [{ text: 'OK' }]
      );
      setIsAuthenticating(false);
      return;
    }

    setIsAuthenticating(false);

    // Update patient
    updatePatientMutation.mutate(
      { id, data: { demographics } },
      {
        onSuccess: (updatedPatient) => {
          secureLogger.info(`Patient updated successfully: ${updatedPatient.id}`);
          Alert.alert(
            'Success',
            `Patient information for ${updatedPatient.demographics.firstName} ${updatedPatient.demographics.lastName} has been updated successfully.`,
            [
              {
                text: 'OK',
                onPress: () => router.back(),
              },
            ]
          );
        },
        onError: (error) => {
          secureLogger.error('Failed to update patient:', error);
          Alert.alert(
            'Update Failed',
            'Failed to update patient information. Please try again.',
            [{ text: 'OK' }]
          );
        },
      }
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Changes',
      'Are you sure you want to cancel? All changes will be lost.',
      [
        { text: 'Continue Editing', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Edit Patient</Text>
          <Text style={styles.subtitle}>
            {patient.demographics.firstName} {patient.demographics.lastName} (MRN: {patient.mrn})
          </Text>
        </View>

        <PatientForm
          initialData={patient.demographics}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={updatePatientMutation.isPending || isAuthenticating}
          submitLabel={isAuthenticating ? 'Authenticating...' : 'Update Patient'}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
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
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563EB',
  },
});
