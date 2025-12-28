/**
 * New Patient Registration Screen
 * Form for registering a new patient
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PatientForm } from '../../../components/patients/PatientForm';
import { useCreatePatient } from '../../../lib/api/patient-api';
import { biometricAuth } from '../../../lib/storage/biometric-auth';
import { PatientDemographics } from '../../../types/patient.types';
import { secureLogger } from '../../../lib/utils/secure-logger';

export default function NewPatientScreen() {
  const router = useRouter();
  const createPatientMutation = useCreatePatient();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSubmit = async (demographics: PatientDemographics) => {
    // SECURITY: Require biometric confirmation before creating patient
    setIsAuthenticating(true);

    try {
      const isAuthenticated = await biometricAuth.authenticate({
        promptMessage: 'Authenticate to register new patient',
        cancelLabel: 'Cancel',
      });

      if (!isAuthenticated) {
        Alert.alert(
          'Authentication Required',
          'Biometric authentication is required to register a new patient.',
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

    // Create patient
    createPatientMutation.mutate(
      { demographics },
      {
        onSuccess: (patient) => {
          secureLogger.info(`Patient registered successfully: ${patient.id}`);
          Alert.alert(
            'Success',
            `Patient ${patient.demographics.firstName} ${patient.demographics.lastName} has been registered successfully.`,
            [
              {
                text: 'View Patient',
                onPress: () => router.replace(`/(app)/patients/${patient.id}`),
              },
              {
                text: 'Back to List',
                onPress: () => router.back(),
              },
            ]
          );
        },
        onError: (error) => {
          secureLogger.error('Failed to register patient:', error);
          Alert.alert(
            'Registration Failed',
            'Failed to register patient. Please try again.',
            [{ text: 'OK' }]
          );
        },
      }
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Registration',
      'Are you sure you want to cancel? All entered data will be lost.',
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Text style={styles.title}>New Patient Registration</Text>
          <Text style={styles.subtitle}>
            Enter patient demographics and contact information
          </Text>
        </View>

        <PatientForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={createPatientMutation.isPending || isAuthenticating}
          submitLabel={isAuthenticating ? 'Authenticating...' : 'Register Patient'}
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
});
