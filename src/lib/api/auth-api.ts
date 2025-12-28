/**
 * Authentication API
 * API functions for user authentication and profile management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { User, UserProfile, UserRegistration, UserPreferences } from '../../types/auth.types';

/**
 * Query keys for authentication-related data
 */
export const authQueryKeys = {
  currentUser: ['auth', 'current-user'] as const,
  userProfile: (userId: string) => ['auth', 'user-profile', userId] as const,
  userPreferences: (userId: string) => ['auth', 'user-preferences', userId] as const,
};

/**
 * API Endpoints
 */
const AUTH_ENDPOINTS = {
  CURRENT_USER: '/api/auth/me',
  REGISTER: '/api/auth/register',
  USER_PROFILE: (userId: string) => `/api/users/${userId}/profile`,
  USER_PREFERENCES: (userId: string) => `/api/users/${userId}/preferences`,
  UPDATE_PROFILE: (userId: string) => `/api/users/${userId}/profile`,
  UPDATE_PREFERENCES: (userId: string) => `/api/users/${userId}/preferences`,
} as const;

/**
 * Gets the current authenticated user's information
 */
export async function getCurrentUser(): Promise<UserProfile> {
  return apiClient.get<UserProfile>(AUTH_ENDPOINTS.CURRENT_USER);
}

/**
 * Registers a new user
 */
export async function registerUser(userData: UserRegistration): Promise<User> {
  return apiClient.post<User>(AUTH_ENDPOINTS.REGISTER, userData);
}

/**
 * Gets a user's profile by ID
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  return apiClient.get<UserProfile>(AUTH_ENDPOINTS.USER_PROFILE(userId));
}

/**
 * Updates a user's profile
 */
export async function updateUserProfile(
  userId: string,
  profileData: Partial<UserProfile>
): Promise<UserProfile> {
  return apiClient.patch<UserProfile>(
    AUTH_ENDPOINTS.UPDATE_PROFILE(userId),
    profileData
  );
}

/**
 * Gets a user's preferences
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  return apiClient.get<UserPreferences>(AUTH_ENDPOINTS.USER_PREFERENCES(userId));
}

/**
 * Updates a user's preferences
 */
export async function updateUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<UserPreferences> {
  return apiClient.patch<UserPreferences>(
    AUTH_ENDPOINTS.UPDATE_PREFERENCES(userId),
    preferences
  );
}

/**
 * React Query Hooks
 */

/**
 * Hook to fetch the current user's profile
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: authQueryKeys.currentUser,
    queryFn: getCurrentUser,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}

/**
 * Hook to fetch a user's profile
 */
export function useUserProfile(userId: string, enabled = true) {
  return useQuery({
    queryKey: authQueryKeys.userProfile(userId),
    queryFn: () => getUserProfile(userId),
    enabled: !!userId && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch user preferences
 */
export function useUserPreferences(userId: string, enabled = true) {
  return useQuery({
    queryKey: authQueryKeys.userPreferences(userId),
    queryFn: () => getUserPreferences(userId),
    enabled: !!userId && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to update user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      profileData,
    }: {
      userId: string;
      profileData: Partial<UserProfile>;
    }) => updateUserProfile(userId, profileData),
    onSuccess: (data, variables) => {
      // Invalidate and refetch user profile queries
      queryClient.invalidateQueries({ queryKey: authQueryKeys.currentUser });
      queryClient.invalidateQueries({
        queryKey: authQueryKeys.userProfile(variables.userId),
      });
    },
  });
}

/**
 * Hook to update user preferences
 */
export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      preferences,
    }: {
      userId: string;
      preferences: Partial<UserPreferences>;
    }) => updateUserPreferences(userId, preferences),
    onSuccess: (data, variables) => {
      // Invalidate and refetch user preferences queries
      queryClient.invalidateQueries({
        queryKey: authQueryKeys.userPreferences(variables.userId),
      });
      queryClient.invalidateQueries({ queryKey: authQueryKeys.currentUser });
    },
  });
}

/**
 * Hook to register a new user
 */
export function useRegisterUser() {
  return useMutation({
    mutationFn: (userData: UserRegistration) => registerUser(userData),
  });
}
