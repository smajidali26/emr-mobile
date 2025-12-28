/**
 * PatientSearchInput Component
 * Search input with suggestions for patient search
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { TextInput } from '../ui/TextInput';
import { usePatientSearch } from '../../lib/api/patient-api';
import { usePatientStore } from '../../stores/patient-store';
import { PatientSearchResult } from '../../types/patient.types';
import { secureLogger } from '../../lib/utils/secure-logger';

interface PatientSearchInputProps {
  onSelectPatient: (patient: PatientSearchResult) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export const PatientSearchInput: React.FC<PatientSearchInputProps> = ({
  onSelectPatient,
  placeholder = 'Search by name, MRN, or phone...',
  autoFocus = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const { addSearchQuery, searchHistory } = usePatientStore();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch search results
  const { data: searchResults, isLoading, error } = usePatientSearch(debouncedQuery);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setShowSuggestions(text.length >= 2);
  };

  const handleSelectPatient = (patient: PatientSearchResult) => {
    // HIPAA Compliance: Log search without sensitive data
    secureLogger.info('Patient selected from search');

    addSearchQuery(searchQuery);
    setSearchQuery('');
    setShowSuggestions(false);
    Keyboard.dismiss();
    onSelectPatient(patient);
  };

  const handleSearchHistorySelect = (query: string) => {
    setSearchQuery(query);
    setShowSuggestions(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderSearchResult = ({ item }: { item: PatientSearchResult }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSelectPatient(item)}
      activeOpacity={0.7}
    >
      <View style={styles.suggestionContent}>
        <Text style={styles.suggestionName}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={styles.suggestionMrn}>MRN: {item.mrn}</Text>
      </View>
      <View style={styles.suggestionMeta}>
        <Text style={styles.suggestionDob}>DOB: {formatDate(item.dateOfBirth)}</Text>
        <Text style={styles.suggestionPhone}>{item.phoneNumber}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSearchHistory = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => handleSearchHistorySelect(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.historyText}>{item}</Text>
    </TouchableOpacity>
  );

  const showHistoryWhenEmpty = searchQuery.length === 0 && searchHistory.length > 0;

  return (
    <View style={styles.container}>
      <TextInput
        placeholder={placeholder}
        value={searchQuery}
        onChangeText={handleSearchChange}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        onFocus={() => setShowSuggestions(searchQuery.length >= 2 || showHistoryWhenEmpty)}
        rightIcon={
          isLoading ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              setShowSuggestions(false);
            }}>
              <Text style={styles.clearButton}>✕</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {showSuggestions && (
        <View style={styles.suggestionsContainer}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to load search results</Text>
            </View>
          ) : showHistoryWhenEmpty ? (
            <>
              <Text style={styles.sectionHeader}>Recent Searches</Text>
              <FlatList
                data={searchHistory.slice(0, 5)}
                renderItem={renderSearchHistory}
                keyExtractor={(item, index) => `history-${index}`}
                keyboardShouldPersistTaps="handled"
                scrollEnabled={false}
              />
            </>
          ) : searchResults && searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              scrollEnabled={false}
              maxToRenderPerBatch={10}
            />
          ) : debouncedQuery.length >= 2 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No patients found</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1001,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  suggestionContent: {
    marginBottom: 4,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  suggestionMrn: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  suggestionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  suggestionDob: {
    fontSize: 12,
    color: '#94A3B8',
  },
  suggestionPhone: {
    fontSize: 12,
    color: '#94A3B8',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    textTransform: 'uppercase',
  },
  historyItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  historyText: {
    fontSize: 14,
    color: '#475569',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  errorContainer: {
    padding: 12,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
  },
  clearButton: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '600',
  },
});
