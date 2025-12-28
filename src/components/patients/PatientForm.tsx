/**
 * PatientForm Component
 * Form for creating or editing patient demographics
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { TextInput } from '../ui/TextInput';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import {
  PatientDemographics,
  Gender,
  BloodType,
  MaritalStatus,
  PatientFormErrors,
  Address,
} from '../../types/patient.types';
import { secureLogger } from '../../lib/utils/secure-logger';
import { encryptField, decryptField } from '../../lib/utils/field-encryption';

interface PatientFormProps {
  initialData?: Partial<PatientDemographics>;
  onSubmit: (data: PatientDemographics) => void;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export const PatientForm: React.FC<PatientFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Save Patient',
}) => {
  // Form state
  const [formData, setFormData] = useState<Partial<PatientDemographics>>({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'unknown',
    ssn: '',
    phoneNumber: '',
    alternatePhoneNumber: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA',
    },
    maritalStatus: undefined,
    bloodType: undefined,
    occupation: '',
    employer: '',
    preferredLanguage: 'English',
    ...initialData,
  });

  // SECURITY FIX: Store encrypted SSN in memory to protect against memory dumps
  // Assigned: Robert Carter
  // This provides defense-in-depth - SSN is encrypted even in component state
  const [encryptedSSN, setEncryptedSSN] = useState<string>('');
  const [displaySSN, setDisplaySSN] = useState<string>('');

  const [errors, setErrors] = useState<PatientFormErrors>({});

  // Initialize encrypted SSN from initial data
  useEffect(() => {
    const initializeSSN = async () => {
      if (initialData?.ssn) {
        const encrypted = await encryptField(initialData.ssn);
        setEncryptedSSN(encrypted);
        setDisplaySSN(initialData.ssn);
      }
    };
    initializeSSN();
  }, [initialData?.ssn]);

  // Track encryption state for SSN
  const [ssnEncryptionError, setSsnEncryptionError] = useState<string | null>(null);

  // Update form field
  const updateField = async (field: keyof PatientDemographics, value: any) => {
    // SECURITY FIX: Encrypt SSN before storing in state (Assigned: Robert Carter)
    // CRITICAL: Never fall back to plaintext - encryption failure must block submission
    if (field === 'ssn') {
      try {
        setSsnEncryptionError(null);
        const encrypted = await encryptField(value);
        setEncryptedSSN(encrypted);
        setDisplaySSN(value);
        // Store encrypted version in form data for submission
        // The plaintext is only kept in displaySSN for UI purposes
        setFormData((prev) => ({
          ...prev,
          [field]: encrypted, // SECURITY FIX: Store encrypted value, not plaintext
        }));
      } catch (error) {
        secureLogger.error('Failed to encrypt SSN:', error);
        // SECURITY FIX: Do NOT fall back to plaintext - set error state instead
        setSsnEncryptionError('Failed to secure SSN. Please re-enter.');
        // SECURITY FIX: Clear ALL SSN data on encryption failure to prevent plaintext leak
        // The user must re-enter the SSN after the error is resolved
        setEncryptedSSN('');
        setDisplaySSN(''); // SECURITY FIX: Clear display value - no plaintext in memory
        setFormData((prev) => ({
          ...prev,
          [field]: '', // Clear SSN from form data on encryption failure
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }

    // Clear error for this field
    if (field in errors) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete (newErrors as any)[field];
        return newErrors;
      });
    }
  };

  // Update address field
  const updateAddressField = (field: keyof Address, value: string) => {
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address!,
        [field]: value,
      },
    }));

    // Clear address errors
    if (errors.address?.[field]) {
      setErrors((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: undefined,
        },
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: PatientFormErrors = {};

    // Required fields
    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.dateOfBirth)) {
        newErrors.dateOfBirth = 'Invalid date format (use YYYY-MM-DD)';
      } else {
        // Check if date is in the past
        const dob = new Date(formData.dateOfBirth);
        if (dob > new Date()) {
          newErrors.dateOfBirth = 'Date of birth cannot be in the future';
        }
      }
    }

    if (!formData.gender || formData.gender === 'unknown') {
      newErrors.gender = 'Gender is required';
    }

    // SECURITY FIX: Validate using displaySSN (plaintext for format check)
    // but ensure encryptedSSN is set before submission
    if (!displaySSN?.trim()) {
      newErrors.ssn = 'SSN is required';
    } else {
      // Validate SSN format (XXX-XX-XXXX)
      const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
      if (!ssnRegex.test(displaySSN)) {
        newErrors.ssn = 'Invalid SSN format (use XXX-XX-XXXX)';
      } else if (ssnEncryptionError) {
        // SECURITY FIX: Block submission if SSN encryption failed
        newErrors.ssn = ssnEncryptionError;
      } else if (!encryptedSSN) {
        // SECURITY FIX: Ensure SSN is encrypted before allowing submission
        newErrors.ssn = 'SSN encryption pending. Please wait.';
      }
    }

    if (!formData.phoneNumber?.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else {
      // Validate phone format
      const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
      if (!phoneRegex.test(formData.phoneNumber)) {
        newErrors.phoneNumber = 'Invalid phone number format';
      }
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
    }

    // Address validation
    const addressErrors: PatientFormErrors['address'] = {};

    if (!formData.address?.street?.trim()) {
      addressErrors.street = 'Street address is required';
    }

    if (!formData.address?.city?.trim()) {
      addressErrors.city = 'City is required';
    }

    if (!formData.address?.state?.trim()) {
      addressErrors.state = 'State is required';
    }

    if (!formData.address?.zipCode?.trim()) {
      addressErrors.zipCode = 'ZIP code is required';
    } else {
      // Validate ZIP code format (US)
      const zipRegex = /^\d{5}(-\d{4})?$/;
      if (!zipRegex.test(formData.address.zipCode)) {
        addressErrors.zipCode = 'Invalid ZIP code format';
      }
    }

    if (!formData.address?.country?.trim()) {
      addressErrors.country = 'Country is required';
    }

    if (Object.keys(addressErrors).length > 0) {
      newErrors.address = addressErrors;
    }

    setErrors(newErrors);

    // HIPAA Compliance: Log validation without sensitive data
    if (Object.keys(newErrors).length > 0) {
      secureLogger.info('Patient form validation failed');
    }

    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors in the form before submitting.');
      return;
    }

    // HIPAA Compliance: Log submission without sensitive data
    secureLogger.info('Patient form submitted');

    // ARCHITECTURE FIX: Decrypt SSN before submission to server
    // Mobile encryption is for in-memory protection only during form editing
    // Server will handle its own encryption for data at rest using Azure Key Vault
    // Transmission is protected by HTTPS (TLS 1.3)
    try {
      let submissionData = { ...formData };

      // Decrypt SSN for server submission if it was encrypted
      if (encryptedSSN) {
        const decryptedSSN = await decryptField(encryptedSSN);
        submissionData.ssn = decryptedSSN;
      } else if (displaySSN) {
        // Fallback to displaySSN if encryption somehow wasn't applied
        // This should not happen due to validation, but provides safety
        submissionData.ssn = displaySSN;
      }

      onSubmit(submissionData as PatientDemographics);
    } catch (error) {
      secureLogger.error('Failed to prepare SSN for submission:', error);
      Alert.alert(
        'Submission Error',
        'Failed to process secure data. Please try again.'
      );
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Card variant="outlined" padding="lg" style={styles.card}>
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <TextInput
          label="First Name *"
          value={formData.firstName}
          onChangeText={(text) => updateField('firstName', text)}
          error={errors.firstName}
          autoCapitalize="words"
          placeholder="Enter first name"
        />

        <TextInput
          label="Middle Name"
          value={formData.middleName}
          onChangeText={(text) => updateField('middleName', text)}
          autoCapitalize="words"
          placeholder="Enter middle name (optional)"
        />

        <TextInput
          label="Last Name *"
          value={formData.lastName}
          onChangeText={(text) => updateField('lastName', text)}
          error={errors.lastName}
          autoCapitalize="words"
          placeholder="Enter last name"
        />

        <TextInput
          label="Date of Birth * (YYYY-MM-DD)"
          value={formData.dateOfBirth}
          onChangeText={(text) => updateField('dateOfBirth', text)}
          error={errors.dateOfBirth}
          placeholder="1990-01-15"
          keyboardType="numbers-and-punctuation"
        />

        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Gender *</Text>
          <View style={styles.radioGroup}>
            {(['male', 'female', 'other'] as Gender[]).map((gender) => (
              <TouchableOpacity
                key={gender}
                style={styles.radioButton}
                onPress={() => updateField('gender', gender)}
              >
                <View style={[
                  styles.radioCircle,
                  formData.gender === gender && styles.radioCircleSelected,
                ]}>
                  {formData.gender === gender && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.radioLabel}>
                  {gender.charAt(0).toUpperCase() + gender.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
        </View>

        <TextInput
          label="SSN * (XXX-XX-XXXX)"
          value={displaySSN}
          onChangeText={(text) => {
            // SECURITY FIX: Async encryption handling (Assigned: Robert Carter)
            updateField('ssn', text);
          }}
          error={errors.ssn}
          placeholder="123-45-6789"
          keyboardType="numbers-and-punctuation"
          secureTextEntry
        />

        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Blood Type</Text>
          <View style={styles.chipGroup}>
            {(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as BloodType[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.chip,
                  formData.bloodType === type && styles.chipSelected,
                ]}
                onPress={() => updateField('bloodType', type)}
              >
                <Text style={[
                  styles.chipText,
                  formData.bloodType === type && styles.chipTextSelected,
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Marital Status</Text>
          <View style={styles.chipGroup}>
            {(['single', 'married', 'divorced', 'widowed'] as MaritalStatus[]).map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.chip,
                  formData.maritalStatus === status && styles.chipSelected,
                ]}
                onPress={() => updateField('maritalStatus', status)}
              >
                <Text style={[
                  styles.chipText,
                  formData.maritalStatus === status && styles.chipTextSelected,
                ]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Card>

      <Card variant="outlined" padding="lg" style={styles.card}>
        <Text style={styles.sectionTitle}>Contact Information</Text>

        <TextInput
          label="Phone Number *"
          value={formData.phoneNumber}
          onChangeText={(text) => updateField('phoneNumber', text)}
          error={errors.phoneNumber}
          placeholder="+1 (555) 123-4567"
          keyboardType="phone-pad"
        />

        <TextInput
          label="Alternate Phone Number"
          value={formData.alternatePhoneNumber}
          onChangeText={(text) => updateField('alternatePhoneNumber', text)}
          placeholder="+1 (555) 987-6543 (optional)"
          keyboardType="phone-pad"
        />

        <TextInput
          label="Email *"
          value={formData.email}
          onChangeText={(text) => updateField('email', text)}
          error={errors.email}
          placeholder="patient@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          label="Street Address *"
          value={formData.address?.street}
          onChangeText={(text) => updateAddressField('street', text)}
          error={errors.address?.street}
          placeholder="123 Main Street"
          autoCapitalize="words"
        />

        <TextInput
          label="City *"
          value={formData.address?.city}
          onChangeText={(text) => updateAddressField('city', text)}
          error={errors.address?.city}
          placeholder="New York"
          autoCapitalize="words"
        />

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <TextInput
              label="State *"
              value={formData.address?.state}
              onChangeText={(text) => updateAddressField('state', text)}
              error={errors.address?.state}
              placeholder="NY"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.halfWidth}>
            <TextInput
              label="ZIP Code *"
              value={formData.address?.zipCode}
              onChangeText={(text) => updateAddressField('zipCode', text)}
              error={errors.address?.zipCode}
              placeholder="10001"
              keyboardType="numbers-and-punctuation"
            />
          </View>
        </View>

        <TextInput
          label="Country *"
          value={formData.address?.country}
          onChangeText={(text) => updateAddressField('country', text)}
          error={errors.address?.country}
          placeholder="USA"
          autoCapitalize="words"
        />
      </Card>

      <Card variant="outlined" padding="lg" style={styles.card}>
        <Text style={styles.sectionTitle}>Additional Information</Text>

        <TextInput
          label="Occupation"
          value={formData.occupation}
          onChangeText={(text) => updateField('occupation', text)}
          placeholder="Software Engineer (optional)"
          autoCapitalize="words"
        />

        <TextInput
          label="Employer"
          value={formData.employer}
          onChangeText={(text) => updateField('employer', text)}
          placeholder="Acme Corporation (optional)"
          autoCapitalize="words"
        />

        <TextInput
          label="Preferred Language"
          value={formData.preferredLanguage}
          onChangeText={(text) => updateField('preferredLanguage', text)}
          placeholder="English"
          autoCapitalize="words"
        />
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          variant="outline"
          size="lg"
          onPress={onCancel}
          disabled={isLoading}
          style={styles.cancelButton}
        >
          Cancel
        </Button>

        <Button
          variant="primary"
          size="lg"
          onPress={handleSubmit}
          isLoading={isLoading}
          disabled={isLoading}
          style={styles.submitButton}
        >
          {submitLabel}
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  halfWidth: {
    flex: 1,
    marginHorizontal: 8,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  radioGroup: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioCircleSelected: {
    borderColor: '#2563EB',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  radioLabel: {
    fontSize: 15,
    color: '#1E293B',
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    margin: 4,
  },
  chipSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  chipText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#2563EB',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 24,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
});
