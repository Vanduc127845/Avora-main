import { get, put, del, type ApiRequestConfig } from './api';
import type { UserProfile, AccessibilitySettings, PrivacySettings } from '../lib/shared';

export const userService = {
  async getProfile(config?: ApiRequestConfig): Promise<{ user: UserProfile }> {
    return get<{ user: UserProfile }>('/api/users/profile', {
      cacheTtlMs: 60_000,
      ...config,
    });
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<{ user: UserProfile }> {
    return put<{ user: UserProfile }>('/api/users/profile', updates);
  },

  async updateAccessibility(settings: Partial<AccessibilitySettings>): Promise<{ user: UserProfile }> {
    return put<{ user: UserProfile }>('/api/users/accessibility', settings);
  },

  async updatePrivacy(settings: Partial<PrivacySettings>): Promise<{ user: UserProfile }> {
    return put<{ user: UserProfile }>('/api/users/privacy', settings);
  },

  async deleteAccount(): Promise<{ message: string }> {
    return del<{ message: string }>('/api/users/account');
  },
};
