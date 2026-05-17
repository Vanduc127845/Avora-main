import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Briefcase,
  Heart,
  HelpCircle,
  Map,
  Mic,
  Play,
  Settings,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { navigationAgents, type AgentId } from '../../lib/agentRegistry';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const iconByPath = {
  '/dashboard': BarChart3,
  '/profile': User,
  '/assessment': Sparkles,
  '/jobs': Briefcase,
  '/roadmaps': Map,
  '/interviews': Mic,
  '/confidence': Heart,
  '/simulation': Play,
  '/settings': Settings,
  '/docs': HelpCircle,
};

const navItems = navigationAgents
  .filter((agent) => !['settings', 'help'].includes(agent.id))
  .map((agent) => ({
    ...agent,
    icon: iconByPath[agent.path as keyof typeof iconByPath] || Sparkles,
    description: agent.scope,
  }));

const bottomItems = navigationAgents
  .filter((agent) => ['settings', 'help'].includes(agent.id))
  .map((agent) => ({
    ...agent,
    icon: iconByPath[agent.path as keyof typeof iconByPath] || HelpCircle,
  }));

type AgentRuntimeStatus = 'idle' | 'thinking' | 'done' | 'error';

const formatLastActive = (date: Date) =>
  date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const [agentStatuses, setAgentStatuses] = React.useState<Partial<Record<AgentId, AgentRuntimeStatus>>>({});
  const [lastActive, setLastActive] = React.useState<Partial<Record<AgentId, string>>>({});

  React.useEffect(() => {
    const handleStatus = (event: Event) => {
      const detail = (event as CustomEvent<{ agentId?: AgentId; status?: AgentRuntimeStatus }>).detail;
      if (!detail?.agentId || !detail.status) return;

      setAgentStatuses((previous) => ({ ...previous, [detail.agentId!]: detail.status }));
      if (detail.status === 'done' || detail.status === 'error') {
        setLastActive((previous) => ({ ...previous, [detail.agentId!]: `Hoạt động lúc ${formatLastActive(new Date())}` }));
      }
    };

    window.addEventListener('avora:agent-status', handleStatus);
    return () => window.removeEventListener('avora:agent-status', handleStatus);
  }, []);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-950/45 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 h-full w-72 border-r border-stone-200 bg-white
          transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:z-30 lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        role="navigation"
        aria-label="Điều hướng ứng dụng"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-stone-200 px-5">
            <Link to="/dashboard" onClick={onClose} className="flex items-center gap-3">
              <span className="text-2xl font-bold tracking-tight text-stone-950">Avora</span>
            </Link>
            <button
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100 lg:hidden"
              aria-label="Đóng điều hướng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`
                    group flex items-center gap-3 rounded-2xl border-l-4 px-3 py-3 transition-all
                    ${
                      isActive
                        ? `${item.accent.softBg} ${item.accent.text} ${item.accent.border} shadow-sm ring-1 ${item.accent.ring}`
                        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-950'
                    }
                    ${isActive ? '' : 'border-l-transparent'}
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span
                    className={`
                      flex h-10 w-10 items-center justify-center rounded-xl transition-colors
                      ${isActive ? `${item.accent.iconBg} text-white` : 'bg-stone-100 text-stone-500 group-hover:bg-white'}
                    `}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-bold">
                      {item.label}
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                          isActive ? 'bg-white/80 text-stone-700' : 'bg-stone-200 text-stone-500'
                        }`}
                      >
                        AI
                      </span>
                      {agentStatuses[item.id] === 'thinking' && (
                        <span className="relative flex h-2.5 w-2.5" aria-label="Agent đang xử lý">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        </span>
                      )}
                    </span>
                    <span className={`block truncate text-xs ${isActive ? item.accent.text : 'text-stone-400'}`}>
                      {item.agentName}
                    </span>
                    <span className="block truncate text-[11px] text-stone-400">
                      {lastActive[item.id] || item.lastActiveLabel}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-stone-200 p-3">
            <div className="space-y-1">
              {bottomItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-xl border-l-4 px-3 py-2.5 text-sm font-semibold transition-colors ${
                      isActive
                        ? `${item.accent.softBg} ${item.accent.text} ${item.accent.border}`
                        : 'border-l-transparent text-stone-600 hover:bg-stone-100 hover:text-stone-950'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex flex-1 items-center justify-between gap-2">
                      {item.label}
                      <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold text-stone-500">
                        AI
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
