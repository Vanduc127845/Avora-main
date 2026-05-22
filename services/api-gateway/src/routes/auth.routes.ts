import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../middleware/error.middleware.js';
import { createId, demoPasswordResetTokens, demoProfiles, demoUsers } from '../data/demo-store.js';
import { saveDemoData } from '../data/demo-persistence.js';
import {
  getOptionalSupabaseAdmin,
  getOptionalSupabaseAuthClient,
  getSupabaseAuthClient,
} from '../utils/supabase.js';
import type { UserProfile } from '../types/shared.js';

const router: Router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const createToken = (user: { id: string; email?: string }) =>
  jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

const createDefaultProfile = (user: { id: string; email: string; name: string }): UserProfile => ({
  id: user.id,
  email: user.email,
  name: user.name,
  createdAt: new Date(),
  updatedAt: new Date(),
  disabilityProfile: {
    primaryType: null,
    secondaryTypes: [],
    severity: null,
    accommodations: [],
    onsetAge: null,
    disclosureLevel: 'private',
  },
  accessibilitySettings: {
    fontSize: 100,
    highContrast: false,
    reducedMotion: false,
    voiceNavigation: false,
    keyboardOnly: false,
    screenReaderOptimized: false,
    extraTime: false,
    preferredInput: 'text',
  },
  careerProfile: {
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
  },
  privacySettings: {
    shareProfile: false,
    shareProgress: false,
    anonymousAnalytics: true,
  },
});

const ensureProfile = (user: { id: string; email: string; name: string }) => {
  if (!demoProfiles.has(user.id)) {
    demoProfiles.set(user.id, createDefaultProfile(user));
  }
  return demoProfiles.get(user.id)!;
};

const findDemoUserByEmail = (email: string) =>
  [...demoUsers.values()].find((user) => user.email.toLowerCase() === email.toLowerCase());

const isPasswordResetDryRun = () =>
  process.env.AUTH_PASSWORD_RESET_DRY_RUN === 'true' ||
  (process.env.NODE_ENV !== 'production' && process.env.AUTH_PASSWORD_RESET_DRY_RUN !== 'false');

router.post('/register',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').trim().notEmpty(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(errors.array()[0].msg, 400);
      }

      const { email, password, name } = req.body;
      const supabase = getOptionalSupabaseAdmin();

      if (!supabase) {
        const existing = findDemoUserByEmail(email);
        if (existing) throw new AppError('Email already registered', 400);

        const passwordHash = await bcrypt.hash(password, 10);
        const demoUser = { id: createId('user'), email, passwordHash, name };
        demoUsers.set(demoUser.id, demoUser);
        ensureProfile(demoUser);
        await saveDemoData();

        res.status(201).json({
          message: 'Registration successful',
          user: {
            id: demoUser.id,
            email: demoUser.email,
            name: demoUser.name,
          },
          token: createToken(demoUser),
        });
        return;
      }

      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: { name },
        email_confirm: true,
      });

      if (error) {
        if (error.message.includes('already been registered')) {
          throw new AppError('Email already registered', 400);
        }
        throw new AppError(error.message, 400);
      }

      const user = data.user;

      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        name,
        provider: 'email',
      }, { onConflict: 'id' });

      res.status(201).json({
        message: 'Registration successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name,
        },
        token: createToken({ id: user.id, email: user.email }),
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Invalid credentials', 400);
      }

      const { email, password } = req.body;
      const supabase = getOptionalSupabaseAuthClient();

      if (!supabase) {
        const demoUser = findDemoUserByEmail(email);
        const passwordMatches = demoUser ? await bcrypt.compare(password, demoUser.passwordHash) : false;
        if (!demoUser || !passwordMatches) throw new AppError('Invalid credentials', 401);

        res.json({
          message: 'Login successful',
          user: {
            id: demoUser.id,
            email: demoUser.email,
            name: demoUser.name,
          },
          token: createToken(demoUser),
        });
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new AppError('Invalid credentials', 401);
      }

      const user = data.user;

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name,
        },
        token: createToken({ id: user.id, email: user.email }),
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/forgot-password',
  body('email').isEmail().normalizeEmail(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Valid email is required', 400);
      }

      const { email } = req.body;
      const supabase = getOptionalSupabaseAuthClient();

      if (supabase) {
        if (isPasswordResetDryRun()) {
          res.json({
            message: 'Password reset instructions sent if the email exists.',
            delivery: 'dry-run',
          });
          return;
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${frontendUrl}/login?mode=reset`,
        });
        if (error) throw new AppError(error.message, 400);

        res.json({
          message: 'Password reset instructions sent if the email exists.',
        });
        return;
      }

      const demoUser = findDemoUserByEmail(email);
      if (!demoUser) {
        res.json({
          message: 'Password reset instructions sent if the email exists.',
        });
        return;
      }

      const resetToken = createId('reset');
      demoPasswordResetTokens.set(resetToken, {
        userId: demoUser.id,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      res.json({
        message: 'Demo reset token created. Enter a new password to continue.',
        resetToken,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/reset-password',
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(errors.array()[0].msg, 400);
      }

      const { token, password } = req.body;
      const reset = demoPasswordResetTokens.get(token);

      if (!reset || reset.expiresAt.getTime() < Date.now()) {
        demoPasswordResetTokens.delete(token);
        throw new AppError('Reset link expired. Please request a new one.', 400);
      }

      const demoUser = demoUsers.get(reset.userId);
      if (!demoUser) {
        demoPasswordResetTokens.delete(token);
        throw new AppError('Reset link is invalid.', 400);
      }

      const passwordHash = await bcrypt.hash(password, 10);
      demoUsers.set(demoUser.id, { ...demoUser, passwordHash });
      demoPasswordResetTokens.delete(token);
      await saveDemoData();

      res.json({
        message: 'Password updated successfully. You can sign in now.',
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/logout', (_req, res) => {
  res.json({ message: 'Logout successful' });
});

router.get('/oauth/:provider', async (req, res, next) => {
    try {
      const { provider } = req.params;

      if (!['google', 'microsoft'].includes(provider)) {
      throw new AppError('Invalid OAuth provider', 400);
    }

    const redirectUrl = `${req.protocol}://${req.get('host')}/api/auth/oauth/${provider}/callback`;
    const supabase = getSupabaseAuthClient();

    const oauthProvider = provider === 'microsoft' ? 'azure' : 'google';

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: oauthProvider,
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
        scopes: provider === 'microsoft' ? 'openid profile email' : undefined,
      },
    });

    if (error) throw error;

    res.json({ url: data.url });
  } catch (error) {
    next(error);
  }
});

router.get('/oauth/:provider/callback', async (req, res, next) => {
    try {
      const { code } = req.query;
      const provider = req.params.provider;

      if (!['google', 'microsoft'].includes(provider as string)) {
      throw new AppError('Invalid OAuth provider', 400);
    }

    // Redirect to frontend with code for PKCE exchange
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const callbackUrl = new URL(`${frontendUrl}/auth/callback`);
    callbackUrl.searchParams.set('code', code as string);
    callbackUrl.searchParams.set('provider', provider);

    res.redirect(callbackUrl.toString());
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError('Refresh token required', 400);
    }

    const decoded = jwt.verify(refreshToken, JWT_SECRET) as { userId: string };
    const newToken = jwt.sign(
      { userId: decoded.userId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token: newToken });
  } catch (error) {
    next(new AppError('Invalid refresh token', 401));
  }
});

export const authRouter = router;
