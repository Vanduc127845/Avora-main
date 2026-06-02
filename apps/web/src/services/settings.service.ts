import { get, patch, type ApiRequestConfig } from './api';

export type UserSettings = {
  userId: string;
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    weeklyDigest: boolean;
    interviewReminders: boolean;
  };
  privacy: {
    shareProfile: boolean;
    shareProgress: boolean;
    anonymousAnalytics: boolean;
  };
  language: string;
  timezone: string;
  disconnectedProviders: string[];
  updatedAt: string;
};

export type SettingsUpdate = {
  notifications?: Partial<UserSettings['notifications']>;
  privacy?: Partial<UserSettings['privacy']>;
  language?: string;
  timezone?: string;
  account?: {
    password?: string;
    disconnectedProvider?: string;
  };
};

export const DEFAULT_USER_SETTINGS: Omit<UserSettings, 'userId' | 'updatedAt'> = {
  notifications: {
    emailNotifications: true,
    pushNotifications: false,
    weeklyDigest: true,
    interviewReminders: true,
  },
  privacy: {
    shareProfile: false,
    shareProgress: false,
    anonymousAnalytics: true,
  },
  language: 'en',
  timezone: 'auto',
  disconnectedProviders: [],
};

export const settingsService = {
  get(config?: ApiRequestConfig) {
    return get<{ settings: UserSettings }>('/api/settings', {
      cacheKey: 'settings:get',
      cacheTtlMs: 15_000,
      ...config,
    });
  },

  update(settings: SettingsUpdate) {
    return patch<{ settings: UserSettings; message: string }>('/api/settings', settings);
  },

  exportData() {
    return get<Record<string, unknown>>('/api/settings/export', {
      cacheTtlMs: 0,
      dedupe: false,
    });
  },
};
