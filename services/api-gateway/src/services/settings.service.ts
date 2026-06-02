import bcrypt from 'bcryptjs';
import {
  demoAgentMemories,
  demoAssessments,
  demoConfidenceEntries,
  demoInterviews,
  demoProfiles,
  demoRoadmaps,
  demoSavedJobs,
  demoSettings,
  demoUsers,
  type DemoUserSettings,
} from '../data/demo-store.js';
import { saveDemoData } from '../data/demo-persistence.js';
import { AppError } from '../middleware/error.middleware.js';
import { getOptionalSupabaseAdmin } from '../utils/supabase.js';

type StoredAppSettings = Pick<
  DemoUserSettings,
  'notifications' | 'language' | 'timezone' | 'disconnectedProviders'
>;

type ProfileSettingsRow = {
  app_settings?: Partial<StoredAppSettings> | null;
  privacy_settings?: Partial<DemoUserSettings['privacy']> | null;
};

export type SettingsUpdate = {
  notifications?: Partial<DemoUserSettings['notifications']>;
  privacy?: Partial<DemoUserSettings['privacy']>;
  language?: string;
  timezone?: string;
  account?: {
    password?: string;
    disconnectedProvider?: string;
  };
};

const defaultSettings = (userId: string): DemoUserSettings => ({
  userId,
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
  updatedAt: new Date().toISOString(),
});

const normalizeSettings = (
  userId: string,
  stored?: Partial<StoredAppSettings> | null,
  privacy?: Partial<DemoUserSettings['privacy']> | null
): DemoUserSettings => {
  const defaults = defaultSettings(userId);
  return {
    ...defaults,
    ...stored,
    userId,
    notifications: {
      ...defaults.notifications,
      ...(stored?.notifications || {}),
    },
    privacy: {
      ...defaults.privacy,
      ...(privacy || {}),
    },
    disconnectedProviders: stored?.disconnectedProviders || [],
  };
};

export class SettingsService {
  async getSettings(userId: string): Promise<DemoUserSettings> {
    const supabase = getOptionalSupabaseAdmin();

    if (supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('app_settings,privacy_settings')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      const row = data as ProfileSettingsRow | null;
      return normalizeSettings(userId, row?.app_settings, row?.privacy_settings);
    }

    return demoSettings.get(userId) || normalizeSettings(
      userId,
      undefined,
      demoProfiles.get(userId)?.privacySettings
    );
  }

  async updateSettings(userId: string, email: string, updates: SettingsUpdate): Promise<DemoUserSettings> {
    const current = await this.getSettings(userId);
    const disconnectedProviders = updates.account?.disconnectedProvider
      ? [...new Set([...current.disconnectedProviders, updates.account.disconnectedProvider])]
      : current.disconnectedProviders;
    const next: DemoUserSettings = {
      ...current,
      notifications: {
        ...current.notifications,
        ...(updates.notifications || {}),
      },
      privacy: {
        ...current.privacy,
        ...(updates.privacy || {}),
      },
      language: updates.language ?? current.language,
      timezone: updates.timezone ?? current.timezone,
      disconnectedProviders,
      updatedAt: new Date().toISOString(),
    };

    if (updates.account?.password) {
      await this.setPassword(userId, updates.account.password);
    }

    const supabase = getOptionalSupabaseAdmin();
    if (supabase) {
      const appSettings: StoredAppSettings = {
        notifications: next.notifications,
        language: next.language,
        timezone: next.timezone,
        disconnectedProviders: next.disconnectedProviders,
      };
      const { error } = await supabase.from('profiles').upsert(
        {
          id: userId,
          email,
          app_settings: appSettings,
          privacy_settings: next.privacy,
          updated_at: next.updatedAt,
        },
        { onConflict: 'id' }
      );

      if (error) throw error;
      return next;
    }

    demoSettings.set(userId, next);
    const profile = demoProfiles.get(userId);
    if (profile) {
      demoProfiles.set(userId, {
        ...profile,
        privacySettings: next.privacy,
        updatedAt: new Date(next.updatedAt),
      });
    }
    await saveDemoData();
    return next;
  }

  async exportData(userId: string, email: string) {
    const supabase = getOptionalSupabaseAdmin();
    const settings = await this.getSettings(userId);

    if (supabase) {
      const [
        profile,
        assessments,
        roadmaps,
        interviews,
        confidenceEntries,
        agentMemories,
        savedJobs,
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('assessments').select('*').eq('user_id', userId),
        supabase.from('roadmaps').select('*').eq('user_id', userId),
        supabase.from('interview_sessions').select('*').eq('user_id', userId),
        supabase.from('confidence_entries').select('*').eq('user_id', userId),
        supabase.from('agent_memories').select('*').eq('user_id', userId),
        supabase.from('saved_jobs').select('*').eq('user_id', userId),
      ]);

      const failed = [
        profile,
        assessments,
        roadmaps,
        interviews,
        confidenceEntries,
        agentMemories,
        savedJobs,
      ].find((result) => result.error);
      if (failed?.error) throw failed.error;

      return {
        exportedAt: new Date().toISOString(),
        user: { id: userId, email },
        profile: profile.data,
        settings,
        assessments: assessments.data || [],
        roadmaps: roadmaps.data || [],
        interviews: interviews.data || [],
        confidenceEntries: confidenceEntries.data || [],
        agentMemories: agentMemories.data || [],
        savedJobs: savedJobs.data || [],
      };
    }

    return {
      exportedAt: new Date().toISOString(),
      user: { id: userId, email },
      profile: demoProfiles.get(userId) || null,
      settings,
      assessments: [...demoAssessments.values()].filter((item) => item.userId === userId),
      roadmaps: [...demoRoadmaps.values()].filter((item) => item.userId === userId),
      interviews: [...demoInterviews.values()].filter((item) => item.userId === userId),
      confidenceEntries: [...demoConfidenceEntries.values()].filter((item) => item.userId === userId),
      agentMemories: [...demoAgentMemories.values()].filter((item) => item.userId === userId),
      savedJobs: [...(demoSavedJobs.get(userId) || [])],
    };
  }

  private async setPassword(userId: string, password: string): Promise<void> {
    const supabase = getOptionalSupabaseAdmin();
    if (supabase) {
      const { error } = await supabase.auth.admin.updateUserById(userId, { password });
      if (error) throw error;
      return;
    }

    const user = demoUsers.get(userId);
    if (!user) {
      throw new AppError('Password can only be set after creating a local account.', 400);
    }

    demoUsers.set(userId, {
      ...user,
      passwordHash: await bcrypt.hash(password, 10),
    });
  }
}
