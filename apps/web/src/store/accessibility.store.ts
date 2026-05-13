import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AccessibilitySettings {
  fontSize: number;
  highContrast: boolean;
  reducedMotion: boolean;
  voiceNavigation: boolean;
  keyboardOnly: boolean;
  screenReaderOptimized: boolean;
  extraTime: boolean;
  preferredInput: 'voice' | 'text' | 'switch' | 'eye-tracking';
}

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  fontSize: 100,
  highContrast: false,
  reducedMotion: false,
  voiceNavigation: false,
  keyboardOnly: false,
  screenReaderOptimized: false,
  extraTime: false,
  preferredInput: 'text',
};

interface AccessibilityState {
  settings: AccessibilitySettings;
  updateSettings: (settings: Partial<AccessibilitySettings>) => void;
  resetSettings: () => void;
  setFontSize: (size: number) => void;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  toggleVoiceNavigation: () => void;
  toggleKeyboardOnly: () => void;
  toggleScreenReader: () => void;
  toggleExtraTime: () => void;
  setPreferredInput: (input: AccessibilitySettings['preferredInput']) => void;
}

export const useAccessibility = create<AccessibilityState>()(
  persist(
    (set) => ({
      settings: DEFAULT_ACCESSIBILITY_SETTINGS,
      
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      
      resetSettings: () =>
        set(() => ({
          settings: DEFAULT_ACCESSIBILITY_SETTINGS,
        })),
      
      setFontSize: (size) =>
        set((state) => ({
          settings: { ...state.settings, fontSize: Math.min(200, Math.max(100, size)) },
        })),
      
      toggleHighContrast: () =>
        set((state) => ({
          settings: { ...state.settings, highContrast: !state.settings.highContrast },
        })),
      
      toggleReducedMotion: () =>
        set((state) => ({
          settings: { ...state.settings, reducedMotion: !state.settings.reducedMotion },
        })),
      
      toggleVoiceNavigation: () =>
        set((state) => ({
          settings: { ...state.settings, voiceNavigation: !state.settings.voiceNavigation },
        })),
      
      toggleKeyboardOnly: () =>
        set((state) => ({
          settings: { ...state.settings, keyboardOnly: !state.settings.keyboardOnly },
        })),
      
      toggleScreenReader: () =>
        set((state) => ({
          settings: { ...state.settings, screenReaderOptimized: !state.settings.screenReaderOptimized },
        })),
      
      toggleExtraTime: () =>
        set((state) => ({
          settings: { ...state.settings, extraTime: !state.settings.extraTime },
        })),
      
      setPreferredInput: (input) =>
        set((state) => ({
          settings: { ...state.settings, preferredInput: input },
        })),
    }),
    {
      name: 'ai4a-accessibility',
    }
  )
);
