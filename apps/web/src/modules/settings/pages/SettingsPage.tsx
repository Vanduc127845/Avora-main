import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Palette, Globe, Shield, Bell, LogOut, 
  Camera, Check, Eye, EyeOff,
  Key, Trash2, Download, Moon
} from 'lucide-react';
import { Button } from '../../../components/ui';
import { useAuthStore } from '../../../store';
import { DEFAULT_ACCESSIBILITY_SETTINGS, useAccessibility } from '../../../store/accessibility.store';
import { handleApiError, userService } from '../../../services';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
};

// Toggle switch component
function Toggle({ enabled, onChange, label, description }: {
  enabled: boolean;
  onChange: () => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      onClick={onChange}
      className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-stone-50 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      aria-pressed={enabled}
    >
      <div className="text-left">
        <p className="font-medium text-stone-800">{label}</p>
        {description && (
          <p className="text-sm text-stone-500 mt-0.5">{description}</p>
        )}
      </div>
      <div 
        className={`w-12 h-7 rounded-full relative transition-colors duration-200 flex-shrink-0 ${
          enabled ? 'bg-primary-500' : 'bg-stone-200'
        }`}
        aria-hidden="true"
      >
        <div 
          className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`} 
        />
      </div>
    </button>
  );
}

// Settings section component
function SettingsSection({ icon: Icon, title, children, accentColor }: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  accentColor: string;
}) {
  return (
    <section className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-stone-100 flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <Icon className="w-5 h-5" style={{ color: accentColor }} />
        </div>
        <h2 className="font-semibold text-stone-800">{title}</h2>
      </div>
      <div className="divide-y divide-stone-100">
        {children}
      </div>
    </section>
  );
}

// Password input with visibility toggle
function PasswordInput({ label, id, placeholder = "Enter password" }: {
  label: string;
  id: string;
  placeholder?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-stone-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          className="input pr-12"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, logout, updateProfile } = useAuthStore();
  const { settings, updateSettings, resetSettings } = useAccessibility();
  const [activeSection, setActiveSection] = useState('profile');
  const [profileForm, setProfileForm] = useState({
    name: user?.name || 'User',
    email: user?.email || 'user@example.com'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingAccessibility, setIsSavingAccessibility] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const response = await userService.getProfile();
        if (!isMounted) return;

        updateProfile(response.user);
        updateSettings(response.user.accessibilitySettings);
        setProfileForm({
          name: response.user.name || 'User',
          email: response.user.email || 'user@example.com',
        });
      } catch (error) {
        const apiError = handleApiError(error);
        console.warn('Unable to load profile from API:', apiError.error);
      }
    };

    if (user) {
      loadProfile();
    }

    return () => {
      isMounted = false;
    };
  }, [updateProfile, updateSettings, user?.id]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const response = await userService.updateProfile({
        name: profileForm.name.trim(),
      });

      updateProfile(response.user);
      setProfileForm({
        name: response.user.name || 'User',
        email: response.user.email || profileForm.email,
      });
      setSaveMessage('Profile saved.');
    } catch (error) {
      const apiError = handleApiError(error);
      setSaveError(apiError.message || apiError.error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAccessibility = async (nextSettings = settings) => {
    setIsSavingAccessibility(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const response = await userService.updateAccessibility(nextSettings);
      updateProfile(response.user);
      updateSettings(response.user.accessibilitySettings);
      setSaveMessage('Accessibility preferences saved.');
    } catch (error) {
      const apiError = handleApiError(error);
      setSaveError(apiError.message || apiError.error);
    } finally {
      setIsSavingAccessibility(false);
    }
  };

  const handleResetAccessibility = async () => {
    resetSettings();
    await handleSaveAccessibility(DEFAULT_ACCESSIBILITY_SETTINGS);
  };

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'accessibility', label: 'Accessibility', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'language', label: 'Language', icon: Globe },
    { id: 'account', label: 'Account', icon: Key },
  ];

  return (
    <div className="min-h-screen bg-stone-50/50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.header {...fadeUp} className="mb-10">
          <h1 className="text-3xl font-display font-semibold text-stone-900 mb-2">
            Settings
          </h1>
          <p className="text-stone-500">
            Manage your account and preferences. Changes are saved automatically.
          </p>
        </motion.header>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <motion.nav 
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 }}
            className="lg:w-64 flex-shrink-0"
            aria-label="Settings navigation"
          >
            <div className="bg-white rounded-2xl border border-stone-100 p-2 lg:sticky lg:top-6">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                      activeSection === section.id
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-stone-600 hover:bg-stone-50'
                    }`}
                    aria-current={activeSection === section.id ? 'page' : undefined}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{section.label}</span>
                    {activeSection === section.id && (
                      <Check className="w-4 h-4 ml-auto" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.nav>

          {/* Content */}
          <motion.div 
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.2 }}
            className="flex-1 space-y-6"
          >
            {/* Profile Section */}
            {activeSection === 'profile' && (
              <SettingsSection icon={User} title="Profile Information" accentColor="#0ea5e9">
                <div className="p-6 space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                        {profileForm.name.charAt(0).toUpperCase()}
                      </div>
                      <button 
                        className="absolute bottom-0 right-0 w-8 h-8 bg-white border-2 border-stone-200 rounded-full flex items-center justify-center hover:border-primary-400 hover:text-primary-600 transition-colors"
                        aria-label="Change avatar"
                      >
                        <Camera className="w-4 h-4 text-stone-500" />
                      </button>
                    </div>
                    <div>
                      <p className="font-medium text-stone-800">{profileForm.name}</p>
                      <p className="text-sm text-stone-500">{profileForm.email}</p>
                    </div>
                  </div>

                  {/* Form */}
                  <div className="grid gap-5">
                    <div className="space-y-2">
                      <label htmlFor="name" className="block text-sm font-medium text-stone-700">
                        Display name
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="input"
                        placeholder="Your name"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-medium text-stone-700">
                        Email address
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="input"
                        disabled
                      />
                      <p className="text-xs text-stone-400">
                        Email is managed through your connected account (Google/Microsoft)
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button 
                      onClick={handleSaveProfile}
                      isLoading={isSaving}
                      disabled={!profileForm.name.trim() || profileForm.name === user?.name}
                    >
                      Save changes
                    </Button>
                  </div>
                </div>
              </SettingsSection>
            )}

            {/* Accessibility Section */}
            {activeSection === 'accessibility' && (
              <SettingsSection icon={Palette} title="Accessibility Preferences" accentColor="#a855f7">
                {/* Font Size */}
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-3">
                      Text size ({settings.fontSize}%)
                    </label>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-stone-500">A</span>
                      <input
                        type="range"
                        min="100"
                        max="200"
                        step="10"
                        value={settings.fontSize}
                        onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
                        className="flex-1 h-2 bg-stone-200 rounded-full appearance-none cursor-pointer accent-primary-500"
                      />
                      <span className="text-lg font-medium text-stone-700">A</span>
                    </div>
                    <div className="flex justify-between text-xs text-stone-400 mt-1">
                      <span>Small</span>
                      <span>Large</span>
                    </div>
                  </div>
                </div>

                {/* Toggles */}
                <Toggle
                  label="High contrast mode"
                  description="Increases color contrast for better visibility"
                  enabled={settings.highContrast}
                  onChange={() => updateSettings({ highContrast: !settings.highContrast })}
                />
                <Toggle
                  label="Reduced motion"
                  description="Minimizes animations and transitions"
                  enabled={settings.reducedMotion}
                  onChange={() => updateSettings({ reducedMotion: !settings.reducedMotion })}
                />
                <Toggle
                  label="Voice navigation"
                  description="Navigate by speaking commands"
                  enabled={settings.voiceNavigation}
                  onChange={() => updateSettings({ voiceNavigation: !settings.voiceNavigation })}
                />
                <Toggle
                  label="Keyboard only mode"
                  description="Optimized for keyboard navigation"
                  enabled={settings.keyboardOnly}
                  onChange={() => updateSettings({ keyboardOnly: !settings.keyboardOnly })}
                />
                <Toggle
                  label="Extra time"
                  description="Extended time for completing tasks"
                  enabled={settings.extraTime}
                  onChange={() => updateSettings({ extraTime: !settings.extraTime })}
                />

                {/* Reset */}
                <div className="p-6">
                  <Button 
                    variant="outline" 
                    onClick={handleResetAccessibility}
                    isLoading={isSavingAccessibility}
                    className="text-stone-600"
                  >
                    Reset to defaults
                  </Button>
                  <Button
                    onClick={() => handleSaveAccessibility()}
                    isLoading={isSavingAccessibility}
                    className="ml-3"
                  >
                    Save accessibility
                  </Button>
                </div>
              </SettingsSection>
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <SettingsSection icon={Bell} title="Notification Preferences" accentColor="#f59e0b">
                <div className="p-4 bg-stone-50">
                  <p className="text-sm text-stone-600">
                    Choose how you want to be notified about updates and reminders.
                  </p>
                </div>
                <Toggle
                  label="Email notifications"
                  description="Updates about your progress and recommendations"
                  enabled={true}
                  onChange={() => {}}
                />
                <Toggle
                  label="Push notifications"
                  description="Real-time alerts in your browser"
                  enabled={false}
                  onChange={() => {}}
                />
                <Toggle
                  label="Weekly digest"
                  description="Summary of your career journey"
                  enabled={true}
                  onChange={() => {}}
                />
                <Toggle
                  label="Interview reminders"
                  description="Get reminded before practice sessions"
                  enabled={true}
                  onChange={() => {}}
                />
              </SettingsSection>
            )}

            {/* Privacy Section */}
            {activeSection === 'privacy' && (
              <SettingsSection icon={Shield} title="Privacy & Data" accentColor="#22c55e">
                <div className="p-4 bg-stone-50">
                  <p className="text-sm text-stone-600">
                    Control how your information is shared and used.
                  </p>
                </div>
                <Toggle
                  label="Profile visibility"
                  description="Allow career mentors to view your profile"
                  enabled={false}
                  onChange={() => {}}
                />
                <Toggle
                  label="Progress sharing"
                  description="Share achievements with the community"
                  enabled={true}
                  onChange={() => {}}
                />
                <Toggle
                  label="Usage analytics"
                  description="Help improve the platform with anonymous data"
                  enabled={true}
                  onChange={() => {}}
                />

                <div className="p-6 space-y-4">
                  <h3 className="font-medium text-stone-800">Your data</h3>
                  <p className="text-sm text-stone-500">
                    Download a copy of your data or delete your account at any time.
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download data
                    </Button>
                  </div>
                </div>
              </SettingsSection>
            )}

            {/* Language Section */}
            {activeSection === 'language' && (
              <SettingsSection icon={Globe} title="Language & Region" accentColor="#0ea5e9">
                <div className="p-6 space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="language" className="block text-sm font-medium text-stone-700">
                      Language
                    </label>
                    <select id="language" className="input">
                      <option value="en">English</option>
                      <option value="vi">Tiếng Việt</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="timezone" className="block text-sm font-medium text-stone-700">
                      Time zone
                    </label>
                    <select id="timezone" className="input">
                      <option value="auto">Auto-detect</option>
                      <option value="utc">UTC</option>
                      <option value="est">Eastern Time (ET)</option>
                      <option value="pst">Pacific Time (PT)</option>
                      <option value="cet">Central European Time (CET)</option>
                      <option value="vst">Vietnam Time (ICT)</option>
                    </select>
                  </div>
                </div>
              </SettingsSection>
            )}

            {/* Account Section */}
            {activeSection === 'account' && (
              <>
                <SettingsSection icon={Key} title="Security" accentColor="#6366f1">
                  <div className="p-6 space-y-5">
                    <p className="text-sm text-stone-500">
                      Your account is connected via OAuth. You can add a password for additional security.
                    </p>
                    <PasswordInput label="New password" id="new-password" />
                    <PasswordInput label="Confirm password" id="confirm-password" />
                    <Button variant="outline">
                      Set password
                    </Button>
                  </div>
                </SettingsSection>

                <SettingsSection icon={Moon} title="Connected Accounts" accentColor="#8b5cf6">
                  <div className="p-6">
                    <p className="text-sm text-stone-500 mb-4">
                      Manage your connected social accounts.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          <div>
                            <p className="font-medium text-stone-800">Google</p>
                            <p className="text-xs text-stone-500">Connected</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  </div>
                </SettingsSection>

                {/* Danger Zone */}
                <section className="bg-white rounded-2xl border border-error-200 overflow-hidden">
                  <div className="px-6 py-5 border-b border-error-100 flex items-center gap-3">
                    <div className="w-10 h-10 bg-error-50 rounded-xl flex items-center justify-center">
                      <Trash2 className="w-5 h-5 text-error-500" />
                    </div>
                    <h2 className="font-semibold text-error-700">Danger Zone</h2>
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-stone-800">Delete your account</p>
                        <p className="text-sm text-stone-500 mt-1">
                          Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        className="border-error-300 text-error-600 hover:bg-error-50 flex-shrink-0"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
                            logout();
                          }
                        }}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Delete account
                      </Button>
                    </div>
                  </div>
                </section>
              </>
            )}
          </motion.div>
        </div>

        {(saveMessage || saveError) && (
          <div
            className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
              saveError
                ? 'border-error-200 bg-error-50 text-error-700'
                : 'border-success-200 bg-success-50 text-success-700'
            }`}
            role={saveError ? 'alert' : 'status'}
          >
            {saveError || saveMessage}
          </div>
        )}
      </div>
    </div>
  );
}
