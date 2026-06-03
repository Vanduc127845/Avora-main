import { get, put, del, type ApiRequestConfig } from './api';
import { demoFallback, withDemoFallback } from './demo-fallback.service';
import type { UserProfile, AccessibilitySettings, PrivacySettings } from '../lib/shared';

export const userService = {
  async getProfile(config?: ApiRequestConfig): Promise<{ user: UserProfile }> {
    return withDemoFallback(
      get<{ user: UserProfile }>('/api/users/profile', {
        cacheTtlMs: 60_000,
        ...config,
      }),
      () => demoFallback.profile.get()
    );
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<{ user: UserProfile }> {
    return withDemoFallback(
      put<{ user: UserProfile }>('/api/users/profile', updates),
      () => demoFallback.profile.update(updates)
    );
  },

  async updateAccessibility(settings: Partial<AccessibilitySettings>): Promise<{ user: UserProfile }> {
    return withDemoFallback(
      put<{ user: UserProfile }>('/api/users/accessibility', settings),
      () => demoFallback.profile.update({ accessibilitySettings: { ...demoFallback.profile.get().user.accessibilitySettings, ...settings } })
    );
  },

  async updatePrivacy(settings: Partial<PrivacySettings>): Promise<{ user: UserProfile }> {
    return withDemoFallback(
      put<{ user: UserProfile }>('/api/users/privacy', settings),
      () => demoFallback.profile.update({ privacySettings: { ...demoFallback.profile.get().user.privacySettings, ...settings } })
    );
  },

  async deleteAccount(): Promise<{ message: string }> {
    return withDemoFallback(
      del<{ message: string }>('/api/users/account'),
      () => demoFallback.profile.delete()
    );
  },
};
