/**
 * Patient Store
 * Zustand store for managing patient state
 */

import { create } from 'zustand';
import { Patient, PatientSearchResult } from '../types/patient.types';

interface PatientStore {
  // Current patient being viewed/edited
  selectedPatient: Patient | null;
  setSelectedPatient: (patient: Patient | null) => void;

  // Recently viewed patients for quick access
  recentPatients: PatientSearchResult[];
  addRecentPatient: (patient: PatientSearchResult) => void;
  clearRecentPatients: () => void;

  // Search history
  searchHistory: string[];
  addSearchQuery: (query: string) => void;
  clearSearchHistory: () => void;

  // UI State
  showSensitiveData: boolean;
  toggleSensitiveData: (show: boolean) => void;
}

export const usePatientStore = create<PatientStore>((set) => ({
  // Selected patient
  selectedPatient: null,
  setSelectedPatient: (patient) =>
    set({
      selectedPatient: patient,
    }),

  // Recently viewed patients (limit to 10)
  recentPatients: [],
  addRecentPatient: (patient) =>
    set((state) => {
      // Remove if already exists
      const filtered = state.recentPatients.filter((p) => p.id !== patient.id);

      // Add to front and limit to 10
      return {
        recentPatients: [patient, ...filtered].slice(0, 10),
      };
    }),
  clearRecentPatients: () =>
    set({
      recentPatients: [],
    }),

  // Search history (limit to 20)
  searchHistory: [],
  addSearchQuery: (query) =>
    set((state) => {
      if (!query || query.trim().length === 0) {
        return state;
      }

      // Remove if already exists
      const filtered = state.searchHistory.filter((q) => q !== query);

      // Add to front and limit to 20
      return {
        searchHistory: [query, ...filtered].slice(0, 20),
      };
    }),
  clearSearchHistory: () =>
    set({
      searchHistory: [],
    }),

  // UI State for sensitive data (SSN, etc.)
  showSensitiveData: false,
  toggleSensitiveData: (show) =>
    set({
      showSensitiveData: show,
    }),
}));
