import { get, post, put, del } from './api';
import type { UserProfile, AccessibilitySettings, PrivacySettings } from '../lib/shared';

export const userService = {
  async getProfile(): Promise<{ user: UserProfile }> {
    return get<{ user: UserProfile }>('/api/users/profile');
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
