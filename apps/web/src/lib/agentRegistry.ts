export type AgentId =
  | 'dashboard'
  | 'profile'
  | 'assessment'
  | 'jobs'
  | 'roadmaps'
  | 'interviews'
  | 'confidence'
  | 'simulation'
  | 'settings'
  | 'help'
  | 'general';

export type AgentConfig = {
  id: AgentId;
  path: string;
  label: string;
  agentName: string;
  scope: string;
  opening: string;
};

export const navigationAgents: AgentConfig[] = [
  {
    id: 'dashboard',
    path: '/dashboard',
    label: 'Dashboard',
    agentName: 'Dashboard Agent',
    scope: 'Progress overview and next best action',
    opening: 'I am your Dashboard Agent. I can summarize your progress, spot the next useful action, and connect you to the right Avora tool.',
  },
  {
    id: 'profile',
    path: '/profile',
    label: 'Profile',
    agentName: 'Profile Agent',
    scope: 'Skills, access needs, and work preferences',
    opening: 'I am your Profile Agent. I can help clarify your skills, work preferences, accessibility needs, and what should be saved in your profile.',
  },
  {
    id: 'assessment',
    path: '/assessment',
    label: 'Assessment',
    agentName: 'Assessment Orchestrator',
    scope: 'Synthesizes every specialist agent',
    opening: 'I am the Assessment Orchestrator. I combine profile, jobs, roadmap, interview, confidence, and simulation signals into one clear career direction.',
  },
  {
    id: 'jobs',
    path: '/jobs',
    label: 'Jobs',
    agentName: 'Jobs Agent',
    scope: 'Job fit, missing skills, and accessible roles',
    opening: 'I am your Jobs Agent. Pick or describe a role, and I will analyze fit, missing skills, accessibility signals, and practical next steps.',
  },
  {
    id: 'roadmaps',
    path: '/roadmaps',
    label: 'Roadmaps',
    agentName: 'Roadmap Agent',
    scope: 'Learning plan and skill gap execution',
    opening: 'I am your Roadmap Agent. I can turn a goal or job gap into weekly learning steps, practice tasks, and portfolio proof.',
  },
  {
    id: 'interviews',
    path: '/interviews',
    label: 'Interviews',
    agentName: 'Interview Agent',
    scope: 'Mock interview and answer coaching',
    opening: 'I am your Interview Agent. I can generate role-specific questions, improve your answers, and help you request support professionally.',
  },
  {
    id: 'confidence',
    path: '/confidence',
    label: 'Confidence',
    agentName: 'Confidence Agent',
    scope: 'Self-advocacy and work confidence',
    opening: 'I am your Confidence Agent. I can help you turn concerns into scripts, boundaries, and small confidence-building actions.',
  },
  {
    id: 'simulation',
    path: '/simulation',
    label: 'Simulation',
    agentName: 'Simulation Agent',
    scope: 'Practice scenarios and workplace decisions',
    opening: 'I am your Simulation Agent. I can run realistic workplace scenarios and help you choose what to say or do next.',
  },
  {
    id: 'settings',
    path: '/settings',
    label: 'Settings',
    agentName: 'Settings Agent',
    scope: 'Accessibility settings and app setup',
    opening: 'I am your Settings Agent. I can help tune accessibility, notification, privacy, and workflow preferences.',
  },
  {
    id: 'help',
    path: '/docs',
    label: 'Help',
    agentName: 'Help Agent',
    scope: 'Documentation and setup guidance',
    opening: 'I am your Help Agent. I can explain how to use Avora, set up the app, and find the right feature.',
  },
];

const defaultAgent: AgentConfig = {
  id: 'general',
  path: '/',
  label: 'Avora',
  agentName: 'Avora General Agent',
  scope: 'Career and accessibility support',
  opening: 'I am Avora. Tell me what you are trying to do, and I will route you to the right specialist or give a direct next step.',
};

export const getAgentForPath = (pathname: string): AgentConfig => {
  const match = navigationAgents
    .filter((agent) => pathname === agent.path || pathname.startsWith(`${agent.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0];

  return match || defaultAgent;
};
