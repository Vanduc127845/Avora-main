export type DisabilityType = 
  | 'motor' 
  | 'visual' 
  | 'auditory' 
  | 'cognitive' 
  | 'speech' 
  | 'chronic_illness' 
  | 'psychiatric'
  | 'other';

export type SeverityLevel = 'mild' | 'moderate' | 'severe' | 'profound';

export interface Accommodation {
  type: string;
  description: string;
  required: boolean;
}

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

export interface DisabilityProfile {
  primaryType: DisabilityType | null;
  secondaryTypes: DisabilityType[];
  severity: SeverityLevel | null;
  accommodations: Accommodation[];
  onsetAge: number | null;
  disclosureLevel: 'public' | 'connections' | 'private';
}

export interface Skill {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  disabilityAdapted: boolean;
  adaptationNotes?: string;
}

export interface WorkPreferences {
  remote: 'required' | 'preferred' | 'flexible' | 'onsite';
  schedule: 'full-time' | 'part-time' | 'flexible' | 'contract';
  environment: string[];
  commuteTolerance: number;
}

export interface CareerProfile {
  interests: string[];
  skills: Skill[];
  values: string[];
  workPreferences: WorkPreferences;
  targetRoles: string[];
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
}

export interface PrivacySettings {
  shareProfile: boolean;
  shareProgress: boolean;
  anonymousAnalytics: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  disabilityProfile: DisabilityProfile;
  accessibilitySettings: AccessibilitySettings;
  careerProfile: CareerProfile;
  privacySettings: PrivacySettings;
}
