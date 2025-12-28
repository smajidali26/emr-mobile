/**
 * Card Component
 * Reusable card container with shadow and variants
 */

import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';

interface CardProps extends ViewProps {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  children,
  style,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'default':
        return styles.defaultVariant;
      case 'outlined':
        return styles.outlinedVariant;
      case 'elevated':
        return styles.elevatedVariant;
      default:
        return styles.defaultVariant;
    }
  };

  const getPaddingStyles = () => {
    switch (padding) {
      case 'none':
        return styles.noPadding;
      case 'sm':
        return styles.smPadding;
      case 'md':
        return styles.mdPadding;
      case 'lg':
        return styles.lgPadding;
      default:
        return styles.mdPadding;
    }
  };

  return (
    <View style={[styles.base, getVariantStyles(), getPaddingStyles(), style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    overflow: 'hidden',
  },

  // Variants
  defaultVariant: {
    backgroundColor: '#FFFFFF',
  },
  outlinedVariant: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  elevatedVariant: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  // Padding
  noPadding: {
    padding: 0,
  },
  smPadding: {
    padding: 12,
  },
  mdPadding: {
    padding: 16,
  },
  lgPadding: {
    padding: 24,
  },
});
