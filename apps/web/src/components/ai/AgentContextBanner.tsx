import { Bot, ChevronRight, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { getAgentForPath, type AgentId } from '../../lib/agentRegistry';

const agentActions: Record<AgentId, string[]> = {
  dashboard: ['Summarize progress', 'Pick next action', 'Find blocked modules'],
  profile: ['Review skills', 'Clarify access needs', 'Improve work preferences'],
  assessment: ['Synthesize all agents', 'Recommend direction', 'Turn signals into one plan'],
  jobs: ['Analyze selected job', 'Find missing skills', 'Check accessibility fit'],
  roadmaps: ['Build learning plan', 'Prioritize gaps', 'Plan portfolio proof'],
  interviews: ['Create mock questions', 'Improve answers', 'Practice support requests'],
  confidence: ['Write self-advocacy script', 'Reduce blockers', 'Build confidence steps'],
  simulation: ['Run workplace scenario', 'Compare choices', 'Practice responses'],
  settings: ['Tune accessibility', 'Check privacy setup', 'Fix app preferences'],
  help: ['Explain features', 'Guide setup', 'Find documentation'],
  general: ['Route to agent', 'Answer simple question', 'Suggest next step'],
};

export default function AgentContextBanner() {
  const location = useLocation();
  const agent = getAgentForPath(location.pathname);
  const actions = agentActions[agent.id] || agentActions.general;

  const openAgentChat = () => {
    window.dispatchEvent(new CustomEvent('avora:open-agent-chat'));
  };

  return (
    <section
      className="mb-6 overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-sm"
      aria-label={`${agent.agentName} context`}
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-white">
            {agent.id === 'assessment' ? <Sparkles className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-primary-700">Active AI agent</p>
              <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-bold text-primary-700">
                {agent.id === 'assessment' ? 'Orchestrator' : 'Specialist'}
              </span>
            </div>
            <h2 className="mt-1 text-lg font-bold text-stone-950">{agent.agentName}</h2>
            <p className="mt-1 max-w-3xl text-sm text-stone-600">{agent.opening}</p>
          </div>
        </div>

        {agent.id !== 'assessment' ? (
          <button
            type="button"
            onClick={openAgentChat}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            Open {agent.agentName}
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <div className="rounded-xl bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-800">
            Use the orchestrator chat below
          </div>
        )}
      </div>

      <div className="border-t border-primary-50 bg-primary-50/40 px-4 py-3">
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <span key={action} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-700 ring-1 ring-primary-100">
              {action}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
