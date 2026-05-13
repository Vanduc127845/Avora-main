export const DISABILITY_TYPES = [
  { value: 'motor', label: 'Motor/Physical', description: 'Limited mobility, hand dexterity, or physical coordination' },
  { value: 'visual', label: 'Visual Impairment', description: 'Low vision, blindness, or color blindness' },
  { value: 'auditory', label: 'Hearing Impairment', description: 'Deafness or difficulty hearing' },
  { value: 'cognitive', label: 'Cognitive/Learning', description: ' dyslexia, ADHD, or memory challenges' },
  { value: 'speech', label: 'Speech/Communication', description: 'Difficulty speaking or verbal communication' },
  { value: 'chronic_illness', label: 'Chronic Illness', description: 'Fatigue, pain, or recurring health conditions' },
  { value: 'psychiatric', label: 'Psychiatric/Mental Health', description: 'Anxiety, depression, or other conditions' },
  { value: 'other', label: 'Other', description: 'A condition not listed above' },
] as const;

export const SEVERITY_LEVELS = [
  { value: 'mild', label: 'Mild', description: 'Minimal impact on daily activities' },
  { value: 'moderate', label: 'Moderate', description: 'Some impact, manageable with accommodations' },
  { value: 'severe', label: 'Severe', description: 'Significant impact, requires substantial support' },
  { value: 'profound', label: 'Profound', description: 'Very significant impact, extensive support needed' },
] as const;

export const ACCOMMODATION_TYPES = [
  { value: 'screen_reader', label: 'Screen Reader Compatible' },
  { value: 'extended_time', label: 'Extended Time' },
  { value: 'voice_input', label: 'Voice Input/Output' },
  { value: 'keyboard_only', label: 'Keyboard-Only Navigation' },
  { value: 'high_contrast', label: 'High Contrast Mode' },
  { value: 'large_text', label: 'Large Text/Zoom' },
  { value: 'closed_captions', label: 'Closed Captions' },
  { value: 'sign_language', label: 'Sign Language Interpreter' },
  { value: 'flexible_schedule', label: 'Flexible Schedule' },
  { value: 'remote_work', label: 'Remote Work Options' },
  { value: 'assistive_technology', label: 'Assistive Technology' },
] as const;

export const INTERESTS = [
  'Technology & Computing',
  'Healthcare & Medicine',
  'Business & Finance',
  'Education & Training',
  'Arts & Design',
  'Science & Research',
  'Engineering',
  'Social Services',
  'Legal & Government',
  'Media & Communication',
  'Sports & Recreation',
  'Environment & Nature',
] as const;

export const WORK_VALUES = [
  'Work-Life Balance',
  'Helping Others',
  'Creativity & Innovation',
  'Job Security',
  'Leadership & Influence',
  'Learning & Growth',
  'Flexibility & Autonomy',
  'Recognition & Status',
  'Financial Reward',
  'Making an Impact',
  'Independence',
  'Teamwork',
] as const;

export const JOB_TYPES = [
  'Software Developer',
  'Data Analyst',
  'UX Designer',
  'Project Manager',
  'Marketing Specialist',
  'Customer Success Manager',
  'Technical Writer',
  'Quality Assurance',
  'DevOps Engineer',
  'Product Manager',
  'Content Creator',
  'Sales Representative',
  'HR Specialist',
  'Finance Analyst',
  'Researcher',
] as const;

export const EDUCATION_LEVELS = [
  { value: 'none', label: 'No Formal Education' },
  { value: 'high_school', label: 'High School/GED' },
  { value: 'vocational', label: 'Vocational Training' },
  { value: 'associate', label: 'Associate Degree' },
  { value: 'bachelor', label: "Bachelor's Degree" },
  { value: 'master', label: "Master's Degree" },
  { value: 'doctorate', label: 'Doctorate/PhD' },
] as const;

export const SKILL_LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'Basic understanding, limited experience' },
  { value: 'intermediate', label: 'Intermediate', description: 'Working knowledge, some projects' },
  { value: 'advanced', label: 'Advanced', description: 'Deep expertise, complex projects' },
  { value: 'expert', label: 'Expert', description: 'Industry-leading expertise' },
] as const;
