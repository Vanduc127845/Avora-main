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

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { path: '/dashboard', icon: BarChart3, label: 'Dashboard', description: 'Overview' },
  { path: '/profile', icon: User, label: 'Profile', description: 'Your access needs' },
  { path: '/assessment', icon: Sparkles, label: 'Assessment', description: 'Career discovery' },
  { path: '/jobs', icon: Briefcase, label: 'Jobs', description: 'Accessible roles' },
  { path: '/roadmaps', icon: Map, label: 'Roadmaps', description: 'Learning plans' },
  { path: '/interviews', icon: Mic, label: 'Interviews', description: 'Practice sessions' },
  { path: '/confidence', icon: Heart, label: 'Confidence', description: 'Self support' },
  { path: '/simulation', icon: Play, label: 'Simulation', description: 'Try scenarios' },
];

const bottomItems = [
  { path: '/settings', icon: Settings, label: 'Settings' },
  { path: '/docs', icon: HelpCircle, label: 'Help' },
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
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{item.label}</span>
                    <span className={`block truncate text-xs ${isActive ? 'text-primary-600' : 'text-stone-400'}`}>
                      {item.description}
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
              <p className="text-sm font-bold">Need a next step?</p>
              <p className="mt-1 text-xs leading-5 text-stone-300">
                Open Avora AI and ask for a roadmap, job plan, or interview script.
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
                    {item.label}
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
