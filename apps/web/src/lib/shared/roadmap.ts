// Roadmap types
export interface LearningResource {
  id: string;
  title: string;
  type: 'article' | 'video' | 'course' | 'book' | 'exercise';
  url: string;
  accessibilityFeatures: string[];
  accommodations: string[];
  estimatedDuration: number;
}

export interface LearningItem {
  id: string;
  title: string;
  description: string;
  type: 'lesson' | 'video' | 'exercise' | 'quiz' | 'project';
  duration: number;
  resources: LearningResource[];
  completedAt: Date | null;
  score?: number;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  type: 'skill' | 'project' | 'certification' | 'checkpoint';
  items: LearningItem[];
  completedAt: Date | null;
}

export interface RoadmapPhase {
  id: string;
  name: string;
  description: string;
  order: number;
  milestones: Milestone[];
  estimatedDuration: number;
  actualDuration?: number;
}

export interface GapSkill {
  name: string;
  importance: 'critical' | 'important' | 'nice-to-have';
  currentLevel: number;
  targetLevel: number;
  resources: LearningResource[];
}

export interface RoadmapProgress {
  completedItems: number;
  totalItems: number;
  percentComplete: number;
  currentPhase: number;
  lastActivityAt: Date;
}

export interface RoadmapSettings {
  weeklyHours: number;
  preferredPace: 'intensive' | 'moderate' | 'relaxed';
  accommodations: string[];
}

export interface Roadmap {
  id: string;
  userId: string;
  targetJobId: string;
  title: string;
  description: string;
  currentSkills: string[];
  gapSkills: GapSkill[];
  phases: RoadmapPhase[];
  settings: RoadmapSettings;
  progress: RoadmapProgress;
  createdAt: Date;
  updatedAt: Date;
}
