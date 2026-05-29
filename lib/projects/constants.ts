import type { ProjectPhase } from '@/lib/db/schema';

export const PROJECT_PHASES: ProjectPhase[] = [
  'PLANNING',
  'DESIGN',
  'DEVELOPMENT',
  'TESTING',
  'STAGING',
  'DEPLOYMENT',
  'DEPLOYED',
  'MAINTENANCE',
  'ARCHIVED',
];

export const PHASE_LABELS: Record<ProjectPhase, string> = {
  PLANNING: 'Planning',
  DESIGN: 'Design',
  DEVELOPMENT: 'Development',
  TESTING: 'Testing',
  STAGING: 'Staging',
  DEPLOYMENT: 'Deployment',
  DEPLOYED: 'Deployed',
  MAINTENANCE: 'Maintenance',
  ARCHIVED: 'Archived',
};

export const PHASE_ICONS: Record<ProjectPhase, string> = {
  PLANNING: '💡',
  DESIGN: '🎨',
  DEVELOPMENT: '⚙️',
  TESTING: '🧪',
  STAGING: '📦',
  DEPLOYMENT: '🚀',
  DEPLOYED: '✅',
  MAINTENANCE: '🔧',
  ARCHIVED: '📁',
};

export const PHASE_COLORS: Record<ProjectPhase, string> = {
  PLANNING: 'border-amber-500/40 bg-amber-900/20 text-amber-200',
  DESIGN: 'border-pink-500/40 bg-pink-900/20 text-pink-200',
  DEVELOPMENT: 'border-purple-500/40 bg-purple-900/20 text-purple-200',
  TESTING: 'border-blue-500/40 bg-blue-900/20 text-blue-200',
  STAGING: 'border-indigo-500/40 bg-indigo-900/20 text-indigo-200',
  DEPLOYMENT: 'border-teal-500/40 bg-teal-900/20 text-teal-200',
  DEPLOYED: 'border-green-500/40 bg-green-900/20 text-green-200',
  MAINTENANCE: 'border-orange-500/40 bg-orange-900/20 text-orange-200',
  ARCHIVED: 'border-gray-500/40 bg-gray-800/50 text-gray-400',
};

export const DEFAULT_MILESTONES: Array<{ title: string; phase: ProjectPhase }> = [
  { title: 'Define requirements & scope', phase: 'PLANNING' },
  { title: 'Create project roadmap', phase: 'PLANNING' },
  { title: 'Wireframes & UI mockups', phase: 'DESIGN' },
  { title: 'System architecture', phase: 'DESIGN' },
  { title: 'Core feature implementation', phase: 'DEVELOPMENT' },
  { title: 'API & database setup', phase: 'DEVELOPMENT' },
  { title: 'Unit & integration tests', phase: 'TESTING' },
  { title: 'QA sign-off', phase: 'TESTING' },
  { title: 'Staging environment setup', phase: 'STAGING' },
  { title: 'Staging smoke tests', phase: 'STAGING' },
  { title: 'Production deployment', phase: 'DEPLOYMENT' },
  { title: 'Post-deploy verification', phase: 'DEPLOYMENT' },
];

export function getPhaseProgress(phase: ProjectPhase): number {
  const index = PROJECT_PHASES.indexOf(phase);
  if (index < 0) return 0;
  if (phase === 'ARCHIVED') return 100;
  return Math.round(((index + 1) / PROJECT_PHASES.length) * 100);
}
