import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../../../components/ui';
import { Briefcase, CheckCircle2, Edit2, Loader2, Mail, Plus, Save, User, X } from 'lucide-react';
import { useAuthStore } from '../../../store';
import { DISABILITY_TYPES, SEVERITY_LEVELS } from '../../../lib/shared';
import type { DisabilityProfile, DisabilityType, SeverityLevel, Skill, UserProfile } from '../../../lib/shared';
import { handleApiError, userService } from '../../../services';

const defaultDisabilityProfile: DisabilityProfile = {
  primaryType: null,
  secondaryTypes: [],
  severity: null,
  accommodations: [],
  onsetAge: null,
  disclosureLevel: 'private',
};

const defaultCareerProfile: UserProfile['careerProfile'] = {
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

const completeProfile = (user?: Partial<UserProfile> | null): UserProfile => ({
  id: user?.id || 'local-user',
  email: user?.email || '',
  name: user?.name || '',
  avatar: user?.avatar || '',
  provider: user?.provider || 'email',
  createdAt: user?.createdAt || new Date().toISOString(),
  updatedAt: user?.updatedAt || new Date().toISOString(),
  disabilityProfile: {
    ...defaultDisabilityProfile,
    ...(user?.disabilityProfile || {}),
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
    ...(user?.accessibilitySettings || {}),
  },
  careerProfile: {
    ...defaultCareerProfile,
    ...(user?.careerProfile || {}),
    workPreferences: {
      ...defaultCareerProfile.workPreferences,
      ...(user?.careerProfile?.workPreferences || {}),
    },
    skills: user?.careerProfile?.skills || [],
    targetRoles: user?.careerProfile?.targetRoles || [],
  },
  privacySettings: {
    shareProfile: false,
    shareProgress: false,
    anonymousAnalytics: true,
    ...(user?.privacySettings || {}),
  },
});

const splitList = (value: string) =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

const makeSkills = (value: string, existing: Skill[]): Skill[] =>
  splitList(value).map((name, index) => {
    const match = existing.find((skill) => skill.name.toLowerCase() === name.toLowerCase());
    return {
      id: match?.id || `skill_${Date.now()}_${index}`,
      name,
      level: match?.level || 'beginner',
      disabilityAdapted: match?.disabilityAdapted || false,
      adaptationNotes: match?.adaptationNotes,
    };
  });

export default function ProfilePage({ editMode: initialEditMode = false }: { editMode?: boolean }) {
  const user = useAuthStore((state) => state.user);
  const updateAuthProfile = useAuthStore((state) => state.updateProfile);
  const [editMode, setEditMode] = React.useState(initialEditMode);
  const [draft, setDraft] = React.useState<UserProfile>(() => completeProfile(user));
  const [skillsInput, setSkillsInput] = React.useState('');
  const [rolesInput, setRolesInput] = React.useState('');
  const [environmentInput, setEnvironmentInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const syncInputs = React.useCallback((profile: UserProfile) => {
    setSkillsInput(profile.careerProfile.skills.map((skill) => skill.name).join(', '));
    setRolesInput(profile.careerProfile.targetRoles.join(', '));
    setEnvironmentInput(profile.careerProfile.workPreferences.environment.join(', '));
  }, []);

  React.useEffect(() => {
    setDraft(completeProfile(user));
    syncInputs(completeProfile(user));
  }, [syncInputs, user]);

  React.useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await userService.getProfile();
        if (!mounted) return;
        const profile = completeProfile(response.user);
        setDraft(profile);
        syncInputs(profile);
        updateAuthProfile(profile);
      } catch (err) {
        if (mounted) setError(handleApiError(err).error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [syncInputs, updateAuthProfile]);

  const updateDisabilityProfile = (updates: Partial<UserProfile['disabilityProfile']>) => {
    setDraft((previous) => ({
      ...previous,
      disabilityProfile: {
        ...previous.disabilityProfile,
        ...updates,
      },
    }));
  };

  const updateCareerProfile = (updates: Partial<UserProfile['careerProfile']>) => {
    setDraft((previous) => ({
      ...previous,
      careerProfile: {
        ...previous.careerProfile,
        ...updates,
        workPreferences: {
          ...previous.careerProfile.workPreferences,
          ...(updates.workPreferences || {}),
        },
      },
    }));
  };

  const saveProfile = async () => {
    setIsSaving(true);
    setError(null);
    setNotice(null);

    const nextProfile: UserProfile = {
      ...draft,
      careerProfile: {
        ...draft.careerProfile,
        skills: makeSkills(skillsInput, draft.careerProfile.skills),
        targetRoles: splitList(rolesInput),
        workPreferences: {
          ...draft.careerProfile.workPreferences,
          environment: splitList(environmentInput),
        },
      },
    };

    try {
      const response = await userService.updateProfile({
        name: nextProfile.name.trim(),
        avatar: nextProfile.avatar,
        disabilityProfile: nextProfile.disabilityProfile,
        careerProfile: nextProfile.careerProfile,
      });
      const saved = completeProfile(response.user);
      setDraft(saved);
      syncInputs(saved);
      updateAuthProfile(saved);
      setEditMode(false);
      setNotice('Profile saved. Avora agents will use this context for job fit, roadmaps, and interviews.');
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || apiError.error);
    } finally {
      setIsSaving(false);
    }
  };

  const profileCompletion = React.useMemo(() => {
    const checks = [
      Boolean(draft.name),
      Boolean(draft.email),
      Boolean(draft.disabilityProfile.primaryType),
      Boolean(draft.disabilityProfile.severity),
      Boolean(draft.careerProfile.experienceLevel),
      Boolean(draft.careerProfile.workPreferences.remote),
      Boolean(draft.careerProfile.targetRoles.length),
      Boolean(draft.careerProfile.skills.length),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [draft]);

  const inputState = editMode ? '' : 'bg-gray-50 text-gray-500';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="heading-2">Your Profile</h1>
          <p className="text-gray-600">Save the skills, goals, and access preferences Avora agents should use.</p>
        </div>
        <div className="flex gap-2">
          {editMode && (
            <Button variant="outline" leftIcon={<X className="h-4 w-4" />} onClick={() => setEditMode(false)}>
              Cancel
            </Button>
          )}
          <Button
            variant={editMode ? 'primary' : 'outline'}
            leftIcon={editMode ? <Save className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
            onClick={editMode ? saveProfile : () => setEditMode(true)}
            isLoading={isSaving}
          >
            {editMode ? 'Save Profile' : 'Edit Profile'}
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-800">
          <Loader2 className="h-4 w-4 animate-spin" />
          Syncing profile...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-800">
          <CheckCircle2 className="h-4 w-4" />
          {notice}
        </div>
      )}

      <Card>
        <CardContent>
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary-100">
              <span className="text-3xl font-bold text-primary-600">
                {draft.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{draft.name || 'Unnamed user'}</h2>
              <p className="text-gray-600">{draft.email || 'No email saved'}</p>
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">Profile completeness</span>
                  <span className="font-semibold text-primary-700">{profileCompletion}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-primary-500" style={{ width: `${profileCompletion}%` }} />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary-600" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input
                className={`input ${inputState}`}
                value={draft.name}
                disabled={!editMode}
                onChange={(event) => setDraft((previous) => ({ ...previous, name: event.target.value }))}
              />
            </div>
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input className="input bg-gray-50 pl-12 text-gray-500" value={draft.email} disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accessibility & Disclosure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Primary disability type</label>
                <select
                  className={`input ${inputState}`}
                  value={draft.disabilityProfile.primaryType || ''}
                  disabled={!editMode}
                  onChange={(event) =>
                    updateDisabilityProfile({ primaryType: (event.target.value || null) as DisabilityType | null })
                  }
                >
                  <option value="">Select...</option>
                  {DISABILITY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Severity level</label>
                <select
                  className={`input ${inputState}`}
                  value={draft.disabilityProfile.severity || ''}
                  disabled={!editMode}
                  onChange={(event) =>
                    updateDisabilityProfile({ severity: (event.target.value || null) as SeverityLevel | null })
                  }
                >
                  <option value="">Select...</option>
                  {SEVERITY_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Disclosure level</label>
              <div className="grid gap-2 sm:grid-cols-3">
                {(['private', 'connections', 'public'] as const).map((level) => (
                  <label
                    key={level}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm capitalize ${
                      draft.disabilityProfile.disclosureLevel === level
                        ? 'border-primary-300 bg-primary-50 text-primary-800'
                        : 'border-gray-200 text-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="disclosure"
                      value={level}
                      checked={draft.disabilityProfile.disclosureLevel === level}
                      disabled={!editMode}
                      onChange={() => updateDisabilityProfile({ disclosureLevel: level })}
                      className="h-4 w-4 text-primary-600"
                    />
                    {level}
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary-600" />
            Career Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="label">Experience level</label>
              <select
                className={`input ${inputState}`}
                value={draft.careerProfile.experienceLevel}
                disabled={!editMode}
                onChange={(event) =>
                  updateCareerProfile({
                    experienceLevel: event.target.value as UserProfile['careerProfile']['experienceLevel'],
                  })
                }
              >
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior</option>
                <option value="executive">Executive</option>
              </select>
            </div>
            <div>
              <label className="label">Work preference</label>
              <select
                className={`input ${inputState}`}
                value={draft.careerProfile.workPreferences.remote}
                disabled={!editMode}
                onChange={(event) =>
                  updateCareerProfile({
                    workPreferences: {
                      ...draft.careerProfile.workPreferences,
                      remote: event.target.value as UserProfile['careerProfile']['workPreferences']['remote'],
                    },
                  })
                }
              >
                <option value="required">Remote required</option>
                <option value="preferred">Remote preferred</option>
                <option value="flexible">Flexible</option>
                <option value="onsite">On-site</option>
              </select>
            </div>
            <div>
              <label className="label">Schedule</label>
              <select
                className={`input ${inputState}`}
                value={draft.careerProfile.workPreferences.schedule}
                disabled={!editMode}
                onChange={(event) =>
                  updateCareerProfile({
                    workPreferences: {
                      ...draft.careerProfile.workPreferences,
                      schedule: event.target.value as UserProfile['careerProfile']['workPreferences']['schedule'],
                    },
                  })
                }
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="flexible">Flexible</option>
                <option value="contract">Contract</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="label">Target roles</label>
              <textarea
                className={`input min-h-[112px] resize-none ${inputState}`}
                value={rolesInput}
                disabled={!editMode}
                onChange={(event) => setRolesInput(event.target.value)}
                placeholder="Frontend Developer, Accessibility QA"
              />
            </div>
            <div>
              <label className="label">Current skills</label>
              <textarea
                className={`input min-h-[112px] resize-none ${inputState}`}
                value={skillsInput}
                disabled={!editMode}
                onChange={(event) => setSkillsInput(event.target.value)}
                placeholder="HTML, CSS, React, communication"
              />
            </div>
            <div>
              <label className="label">Preferred environment</label>
              <textarea
                className={`input min-h-[112px] resize-none ${inputState}`}
                value={environmentInput}
                disabled={!editMode}
                onChange={(event) => setEnvironmentInput(event.target.value)}
                placeholder="quiet workspace, written instructions"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {splitList(rolesInput).map((role) => (
              <span key={role} className="rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700">
                {role}
              </span>
            ))}
            {editMode && (
              <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-3 py-1 text-sm text-gray-500">
                <Plus className="h-3 w-3" />
                Separate items with commas
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
