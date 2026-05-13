import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { AppError } from '../middleware/error.middleware.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { demoProfiles, demoUsers } from '../data/demo-store.js';
import { saveDemoData } from '../data/demo-persistence.js';
import { getOptionalSupabaseAdmin } from '../utils/supabase.js';
import type { UserProfile } from '../types/shared.js';

const router: Router = Router();

const DEFAULT_DISABILITY_PROFILE: UserProfile['disabilityProfile'] = {
  primaryType: null,
  secondaryTypes: [],
  severity: null,
  accommodations: [],
  onsetAge: null,
  disclosureLevel: 'private',
};

const DEFAULT_ACCESSIBILITY_SETTINGS: UserProfile['accessibilitySettings'] = {
  fontSize: 100,
  highContrast: false,
  reducedMotion: false,
  voiceNavigation: false,
  keyboardOnly: false,
  screenReaderOptimized: false,
  extraTime: false,
  preferredInput: 'text',
};

const DEFAULT_CAREER_PROFILE: UserProfile['careerProfile'] = {
  interests: [],
  skills: [],
  values: [],
  workPreferences: {
    remote: 'flexible',
    schedule: 'flexible',
    environment: [],
    commuteTolerance: 30,
  },
  targetRoles: [],
  experienceLevel: 'entry',
};

const DEFAULT_PRIVACY_SETTINGS: UserProfile['privacySettings'] = {
  shareProfile: false,
  shareProgress: false,
  anonymousAnalytics: true,
};

type ProfileRow = {
  id: string;
  email?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  provider?: string | null;
  disability_profile?: Record<string, unknown> | null;
  accessibility_settings?: Record<string, unknown> | null;
  career_profile?: Record<string, unknown> | null;
  privacy_settings?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
};

const normalizeProfile = (row: ProfileRow, fallback?: { email?: string; name?: string }): UserProfile => {
  const disabilityProfile = {
    ...DEFAULT_DISABILITY_PROFILE,
    ...(row.disability_profile || {}),
  } as UserProfile['disabilityProfile'];
  const accessibilitySettings = {
    ...DEFAULT_ACCESSIBILITY_SETTINGS,
    ...(row.accessibility_settings || {}),
  } as UserProfile['accessibilitySettings'];
  const careerProfile = {
    ...DEFAULT_CAREER_PROFILE,
    ...(row.career_profile || {}),
  } as UserProfile['careerProfile'];
  const privacySettings = {
    ...DEFAULT_PRIVACY_SETTINGS,
    ...(row.privacy_settings || {}),
  } as UserProfile['privacySettings'];

  return {
    id: row.id,
    email: row.email || fallback?.email || '',
    name: row.name || fallback?.name || '',
    avatar: row.avatar_url || '',
    provider: row.provider || 'email',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    disabilityProfile,
    accessibilitySettings,
    careerProfile,
    privacySettings,
  };
};

router.use(authMiddleware);

router.get('/profile',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const supabase = getOptionalSupabaseAdmin();

      if (!supabase) {
        const profile = demoProfiles.get(userId!);
        res.json({
          user: profile || normalizeProfile(
            { id: userId!, email: req.user?.email },
            { email: req.user?.email }
          ),
        });
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        res.json({
          user: normalizeProfile(
            { id: userId!, email: req.user?.email },
            { email: req.user?.email }
          ),
        });
        return;
      }

      res.json({ user: normalizeProfile(data, { email: req.user?.email }) });
    } catch (error) {
      next(error);
    }
  }
);

router.put('/profile',
  body('name').optional().isString().trim().notEmpty(),
  body('bio').optional().trim(),
  body('disabilityProfile').optional().isObject(),
  body('careerProfile').optional().isObject(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Invalid input', 400);
      }

      const userId = req.user?.userId;
      const { name, avatar, provider, disabilityProfile, careerProfile } = req.body;
      const supabase = getOptionalSupabaseAdmin();

      if (!supabase) {
        const existing = demoProfiles.get(userId!) || normalizeProfile(
          { id: userId!, email: req.user?.email },
          { email: req.user?.email }
        );
        const next = {
          ...existing,
          name: name ?? existing.name,
          avatar: avatar ?? existing.avatar,
          provider: provider ?? existing.provider,
          disabilityProfile: {
            ...existing.disabilityProfile,
            ...(disabilityProfile || {}),
          },
          careerProfile: {
            ...existing.careerProfile,
            ...(careerProfile || {}),
          },
          updatedAt: new Date().toISOString(),
        };
        demoProfiles.set(userId!, next);
        await saveDemoData();
        res.json({ user: next });
        return;
      }

      const { data: existing, error: existingError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (existingError) throw existingError;

      const updates: Record<string, any> = {
        id: userId,
        email: existing?.email || req.user?.email || null,
        updated_at: new Date().toISOString(),
      };
      if (name !== undefined) updates.name = name;
      if (avatar !== undefined) updates.avatar_url = avatar;
      if (provider !== undefined) updates.provider = provider;
      if (disabilityProfile !== undefined) {
        updates.disability_profile = {
          ...DEFAULT_DISABILITY_PROFILE,
          ...(existing?.disability_profile || {}),
          ...disabilityProfile,
        };
      }
      if (careerProfile !== undefined) {
        updates.career_profile = {
          ...DEFAULT_CAREER_PROFILE,
          ...(existing?.career_profile || {}),
          ...careerProfile,
        };
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert(updates, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;

      res.json({ user: normalizeProfile(data, { email: req.user?.email }) });
    } catch (error) {
      next(error);
    }
  }
);

router.put('/accessibility',
  body('fontSize').optional().isInt({ min: 100, max: 200 }),
  body('highContrast').optional().isBoolean(),
  body('reducedMotion').optional().isBoolean(),
  body('voiceNavigation').optional().isBoolean(),
  body('keyboardOnly').optional().isBoolean(),
  body('screenReaderOptimized').optional().isBoolean(),
  body('extraTime').optional().isBoolean(),
  body('preferredInput').optional().isIn(['voice', 'text', 'switch', 'eye-tracking']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Invalid accessibility settings', 400);
      }

      const userId = req.user?.userId;
      const accessibilitySettings = req.body;
      const supabase = getOptionalSupabaseAdmin();

      if (!supabase) {
        const existing = demoProfiles.get(userId!) || normalizeProfile(
          { id: userId!, email: req.user?.email },
          { email: req.user?.email }
        );
        const next = {
          ...existing,
          accessibilitySettings: {
            ...existing.accessibilitySettings,
            ...accessibilitySettings,
          },
          updatedAt: new Date().toISOString(),
        };
        demoProfiles.set(userId!, next);
        await saveDemoData();
        res.json({ user: next });
        return;
      }

      const { data: existing, error: existingError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (existingError) throw existingError;

      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: existing?.email || req.user?.email || null,
          accessibility_settings: {
            ...DEFAULT_ACCESSIBILITY_SETTINGS,
            ...(existing?.accessibility_settings || {}),
            ...accessibilitySettings,
          },
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;

      res.json({ user: normalizeProfile(data, { email: req.user?.email }) });
    } catch (error) {
      next(error);
    }
  }
);

router.put('/privacy',
  body('shareProfile').optional().isBoolean(),
  body('shareProgress').optional().isBoolean(),
  body('anonymousAnalytics').optional().isBoolean(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Invalid privacy settings', 400);
      }

      const userId = req.user?.userId;
      const privacySettings = req.body;
      const supabase = getOptionalSupabaseAdmin();

      if (!supabase) {
        const existing = demoProfiles.get(userId!) || normalizeProfile(
          { id: userId!, email: req.user?.email },
          { email: req.user?.email }
        );
        const next = {
          ...existing,
          privacySettings: {
            ...existing.privacySettings,
            ...privacySettings,
          },
          updatedAt: new Date().toISOString(),
        };
        demoProfiles.set(userId!, next);
        await saveDemoData();
        res.json({ user: next });
        return;
      }

      const { data: existing, error: existingError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (existingError) throw existingError;

      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: existing?.email || req.user?.email || null,
          privacy_settings: {
            ...DEFAULT_PRIVACY_SETTINGS,
            ...(existing?.privacy_settings || {}),
            ...privacySettings,
          },
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;

      res.json({ user: normalizeProfile(data, { email: req.user?.email }) });
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/account',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const supabase = getOptionalSupabaseAdmin();

      if (!supabase) {
        demoProfiles.delete(userId!);
        demoUsers.delete(userId!);
        await saveDemoData();
        res.json({ message: 'Account deleted successfully' });
        return;
      }

      const { error } = await supabase.auth.admin.deleteUser(userId!);

      if (error) throw error;

      res.json({ message: 'Account deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export const usersRouter = router;
