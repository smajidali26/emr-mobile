/**
 * Button Component
 * Reusable button component with variants and states
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  StyleSheet,
} from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  disabled,
  children,
  style,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return styles.primaryVariant;
      case 'secondary':
        return styles.secondaryVariant;
      case 'outline':
        return styles.outlineVariant;
      case 'ghost':
        return styles.ghostVariant;
      case 'danger':
        return styles.dangerVariant;
      default:
        return styles.primaryVariant;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return styles.smSize;
      case 'md':
        return styles.mdSize;
      case 'lg':
        return styles.lgSize;
      default:
        return styles.mdSize;
    }
  };

  const getTextVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return styles.primaryText;
      case 'secondary':
        return styles.secondaryText;
      case 'outline':
        return styles.outlineText;
      case 'ghost':
        return styles.ghostText;
      case 'danger':
        return styles.dangerText;
      default:
        return styles.primaryText;
    }
  };

  const getTextSizeStyles = () => {
    switch (size) {
      case 'sm':
        return styles.smText;
      case 'md':
        return styles.mdText;
      case 'lg':
        return styles.lgText;
      default:
        return styles.mdText;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        getVariantStyles(),
        getSizeStyles(),
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : '#2563EB'}
        />
      ) : (
        <Text style={[styles.text, getTextVariantStyles(), getTextSizeStyles()]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },

  // Variants
  primaryVariant: {
    backgroundColor: '#2563EB',
  },
  secondaryVariant: {
    backgroundColor: '#64748B',
  },
  outlineVariant: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  ghostVariant: {
    backgroundColor: 'transparent',
  },
  dangerVariant: {
    backgroundColor: '#EF4444',
  },

  // Sizes
  smSize: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  mdSize: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  lgSize: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },

  // Text base
  text: {
    fontWeight: '600',
  },

  // Text variants
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#FFFFFF',
  },
  outlineText: {
    color: '#2563EB',
  },
  ghostText: {
    color: '#2563EB',
  },
  dangerText: {
    color: '#FFFFFF',
  },

  // Text sizes
  smText: {
    fontSize: 14,
  },
  mdText: {
    fontSize: 16,
  },
  lgText: {
    fontSize: 18,
  },
});
