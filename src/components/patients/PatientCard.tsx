/**
 * PatientCard Component
 * Displays patient information in a card format
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../ui/Card';
import { PatientSearchResult } from '../../types/patient.types';

interface PatientCardProps {
  patient: PatientSearchResult;
  onPress?: () => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient, onPress }) => {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/(app)/patients/${patient.id}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'male':
        return 'M';
      case 'female':
        return 'F';
      case 'other':
        return 'O';
      default:
        return 'U';
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card variant="outlined" padding="md" style={styles.card}>
        <View style={styles.header}>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>
              {patient.firstName} {patient.lastName}
            </Text>
            <Text style={styles.mrn}>MRN: {patient.mrn}</Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(patient.status) }]}>
            <Text style={styles.statusText}>
              {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>DOB</Text>
            <Text style={styles.detailValue}>{formatDate(patient.dateOfBirth)}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Gender</Text>
            <Text style={styles.detailValue}>{getGenderLabel(patient.gender)}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Phone</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {patient.phoneNumber}
            </Text>
          </View>
        </View>

        {patient.lastVisitDate && (
          <View style={styles.footer}>
            <Text style={styles.lastVisit}>
              Last visit: {formatDate(patient.lastVisitDate)}
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  mrn: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  footer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  lastVisit: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
});
