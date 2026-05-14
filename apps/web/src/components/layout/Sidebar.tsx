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
import { navigationAgents } from '../../lib/agentRegistry';

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

const bottomItems = [
  { path: '/settings', icon: Settings, label: 'Settings', agentName: 'Settings Agent' },
  { path: '/docs', icon: HelpCircle, label: 'Help', agentName: 'Help Agent' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

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
        aria-label="Dashboard navigation"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-stone-200 px-5">
            <Link to="/dashboard" onClick={onClose} className="flex items-center gap-3">
              <span className="text-2xl font-bold tracking-tight text-stone-950">Avora</span>
            </Link>
            <button
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100 lg:hidden"
              aria-label="Close navigation"
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
                    group flex items-center gap-3 rounded-2xl px-3 py-3 transition-all
                    ${
                      isActive
                        ? 'bg-primary-50 text-primary-800 shadow-sm ring-1 ring-primary-100'
                        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-950'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span
                    className={`
                      flex h-10 w-10 items-center justify-center rounded-xl transition-colors
                      ${isActive ? 'bg-primary-600 text-white' : 'bg-stone-100 text-stone-500 group-hover:bg-white'}
                    `}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-bold">
                      {item.label}
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                          isActive ? 'bg-primary-100 text-primary-700' : 'bg-stone-200 text-stone-500'
                        }`}
                      >
                        AI
                      </span>
                    </span>
                    <span className={`block truncate text-xs ${isActive ? 'text-primary-600' : 'text-stone-400'}`}>
                      {item.agentName}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-stone-200 p-3">
            <div className="mb-3 rounded-2xl bg-stone-950 p-4 text-white">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                <Sparkles className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold">Assessment orchestrates</p>
              <p className="mt-1 text-xs leading-5 text-stone-300">
                Each page has its own AI agent. Assessment combines their signals into one direction.
              </p>
            </div>

            <div className="space-y-1">
              {bottomItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors
                      ${isActive ? 'bg-primary-50 text-primary-700' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-950'}
                    `}
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
