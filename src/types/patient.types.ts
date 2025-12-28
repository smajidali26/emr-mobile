/**
 * Patient Types
 * Defines types for patient data and demographics
 */

export type Gender = 'male' | 'female' | 'other' | 'unknown';
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown';
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed' | 'separated' | 'other';
export type PatientStatus = 'active' | 'inactive' | 'deceased';

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface EmergencyContact {
  id?: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  alternatePhoneNumber?: string;
  email?: string;
  address?: Address;
}

export interface Insurance {
  id?: string;
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  subscriberName: string;
  subscriberId: string;
  relationship: string;
  effectiveDate: string;
  expirationDate?: string;
  isPrimary: boolean;
}

export interface PatientDemographics {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  ssn: string; // Will be masked in UI
  phoneNumber: string;
  alternatePhoneNumber?: string;
  email: string;
  address: Address;
  maritalStatus?: MaritalStatus;
  bloodType?: BloodType;
  occupation?: string;
  employer?: string;
  preferredLanguage?: string;
  race?: string;
  ethnicity?: string;
}

export interface Patient {
  id: string;
  mrn: string; // Medical Record Number
  demographics: PatientDemographics;
  emergencyContacts: EmergencyContact[];
  insurance: Insurance[];
  status: PatientStatus;
  primaryCareProvider?: string;
  registrationDate: string;
  lastVisitDate?: string;
  profilePictureUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface PatientSearchResult {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  phoneNumber: string;
  email: string;
  status: PatientStatus;
  lastVisitDate?: string;
}

export interface PatientListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: PatientStatus;
  sortBy?: 'name' | 'mrn' | 'lastVisit' | 'registrationDate';
  sortOrder?: 'asc' | 'desc';
}

export interface CreatePatientRequest {
  demographics: PatientDemographics;
  emergencyContacts?: EmergencyContact[];
  insurance?: Insurance[];
  primaryCareProvider?: string;
  notes?: string;
}

export interface UpdatePatientRequest {
  demographics?: Partial<PatientDemographics>;
  emergencyContacts?: EmergencyContact[];
  insurance?: Insurance[];
  status?: PatientStatus;
  primaryCareProvider?: string;
  notes?: string;
}

export interface PatientFormErrors {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  ssn?: string;
  phoneNumber?: string;
  email?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  emergencyContacts?: Record<number, {
    name?: string;
    relationship?: string;
    phoneNumber?: string;
  }>;
  insurance?: Record<number, {
    provider?: string;
    policyNumber?: string;
    subscriberName?: string;
    subscriberId?: string;
  }>;
}
