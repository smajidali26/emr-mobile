/**
 * Patient API
 * TanStack Query hooks for patient data operations
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { apiClient } from './client';
import { PaginatedResponse } from '../../types/api.types';
import {
  Patient,
  PatientSearchResult,
  PatientListParams,
  CreatePatientRequest,
  UpdatePatientRequest,
} from '../../types/patient.types';
import { secureLogger } from '../utils/secure-logger';

/**
 * Query Keys for Patient data
 */
export const patientKeys = {
  all: ['patients'] as const,
  lists: () => [...patientKeys.all, 'list'] as const,
  list: (params: PatientListParams) => [...patientKeys.lists(), params] as const,
  details: () => [...patientKeys.all, 'detail'] as const,
  detail: (id: string) => [...patientKeys.details(), id] as const,
  search: (query: string) => [...patientKeys.all, 'search', query] as const,
};

/**
 * Fetch paginated list of patients
 */
const fetchPatients = async (params: PatientListParams = {}): Promise<PaginatedResponse<PatientSearchResult>> => {
  try {
    const queryParams = {
      page: params.page || 1,
      pageSize: params.pageSize || 20,
      search: params.search || undefined,
      status: params.status || undefined,
      sortBy: params.sortBy || 'name',
      sortOrder: params.sortOrder || 'asc',
    };

    return await apiClient.get<PaginatedResponse<PatientSearchResult>>('/api/v1/patients', queryParams);
  } catch (error) {
    secureLogger.error('Failed to fetch patients:', error);
    throw error;
  }
};

/**
 * Fetch single patient by ID
 */
const fetchPatient = async (id: string): Promise<Patient> => {
  try {
    return await apiClient.get<Patient>(`/api/v1/patients/${id}`);
  } catch (error) {
    secureLogger.error(`Failed to fetch patient ${id}:`, error);
    throw error;
  }
};

/**
 * Search patients by query
 */
const searchPatients = async (query: string): Promise<PatientSearchResult[]> => {
  try {
    if (!query || query.trim().length < 2) {
      return [];
    }

    return await apiClient.get<PatientSearchResult[]>('/api/v1/patients/search', { q: query.trim() });
  } catch (error) {
    secureLogger.error('Failed to search patients:', error);
    throw error;
  }
};

/**
 * Create new patient
 */
const createPatient = async (data: CreatePatientRequest): Promise<Patient> => {
  try {
    // HIPAA Compliance: Log patient creation without sensitive data
    secureLogger.info('Creating new patient record');

    return await apiClient.post<Patient>('/api/v1/patients', data);
  } catch (error) {
    secureLogger.error('Failed to create patient:', error);
    throw error;
  }
};

/**
 * Update existing patient
 */
const updatePatient = async ({ id, data }: { id: string; data: UpdatePatientRequest }): Promise<Patient> => {
  try {
    // HIPAA Compliance: Log patient update without sensitive data
    secureLogger.info(`Updating patient record: ${id}`);

    return await apiClient.patch<Patient>(`/api/v1/patients/${id}`, data);
  } catch (error) {
    secureLogger.error(`Failed to update patient ${id}:`, error);
    throw error;
  }
};

/**
 * Delete patient (soft delete)
 */
const deletePatient = async (id: string): Promise<void> => {
  try {
    // HIPAA Compliance: Log patient deletion
    secureLogger.warn(`Deleting patient record: ${id}`);

    await apiClient.delete(`/api/v1/patients/${id}`);
  } catch (error) {
    secureLogger.error(`Failed to delete patient ${id}:`, error);
    throw error;
  }
};

/**
 * Hook: Get paginated list of patients
 */
export const usePatients = (
  params: PatientListParams = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<PatientSearchResult>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<PaginatedResponse<PatientSearchResult>>({
    queryKey: patientKeys.list(params),
    queryFn: () => fetchPatients(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
};

/**
 * Hook: Get single patient by ID
 */
export const usePatient = (
  id: string,
  options?: Omit<UseQueryOptions<Patient>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<Patient>({
    queryKey: patientKeys.detail(id),
    queryFn: () => fetchPatient(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
};

/**
 * Hook: Search patients
 */
export const usePatientSearch = (
  query: string,
  options?: Omit<UseQueryOptions<PatientSearchResult[]>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<PatientSearchResult[]>({
    queryKey: patientKeys.search(query),
    queryFn: () => searchPatients(query),
    enabled: query.length >= 2,
    staleTime: 1000 * 30, // 30 seconds for search
    ...options,
  });
};

/**
 * Hook: Create patient mutation
 */
export const useCreatePatient = (
  options?: UseMutationOptions<Patient, Error, CreatePatientRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation<Patient, Error, CreatePatientRequest>({
    mutationFn: createPatient,
    onSuccess: (data) => {
      // Invalidate patient lists to trigger refetch
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });

      // Add new patient to cache
      queryClient.setQueryData(patientKeys.detail(data.id), data);

      secureLogger.info(`Patient created successfully: ${data.id}`);
    },
    onError: (error) => {
      secureLogger.error('Create patient mutation failed:', error);
    },
    ...options,
  });
};

/**
 * Hook: Update patient mutation
 */
export const useUpdatePatient = (
  options?: UseMutationOptions<Patient, Error, { id: string; data: UpdatePatientRequest }>
) => {
  const queryClient = useQueryClient();

  return useMutation<Patient, Error, { id: string; data: UpdatePatientRequest }>({
    mutationFn: updatePatient,
    onSuccess: (data, variables) => {
      // Invalidate patient lists to trigger refetch
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });

      // Update patient detail cache
      queryClient.setQueryData(patientKeys.detail(variables.id), data);

      secureLogger.info(`Patient updated successfully: ${data.id}`);
    },
    onError: (error) => {
      secureLogger.error('Update patient mutation failed:', error);
    },
    ...options,
  });
};

/**
 * Hook: Delete patient mutation
 */
export const useDeletePatient = (
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deletePatient,
    onSuccess: (_, id) => {
      // Invalidate patient lists and detail
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      queryClient.removeQueries({ queryKey: patientKeys.detail(id) });

      secureLogger.info(`Patient deleted successfully: ${id}`);
    },
    onError: (error) => {
      secureLogger.error('Delete patient mutation failed:', error);
    },
    ...options,
  });
};
