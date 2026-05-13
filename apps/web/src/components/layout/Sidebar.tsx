import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Home, User, Briefcase, Map, Mic, Heart, Play, Settings, HelpCircle } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Dashboard' },
  { path: '/profile', icon: User, label: 'Profile' },
  { path: '/assessment', icon: Briefcase, label: 'Assessment' },
  { path: '/jobs', icon: Briefcase, label: 'Jobs' },
  { path: '/roadmaps', icon: Map, label: 'Roadmaps' },
  { path: '/interviews', icon: Mic, label: 'Interviews' },
  { path: '/confidence', icon: Heart, label: 'Confidence' },
  { path: '/simulation', icon: Play, label: 'Simulation' },
];

const bottomItems = [
  { path: '/settings', icon: Settings, label: 'Settings' },
  { path: '/help', icon: HelpCircle, label: 'Help' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        role="navigation"
        aria-label="Sidebar navigation"
      >
        <div className="flex flex-col h-full">
          <button
            onClick={onClose}
            className="lg:hidden absolute top-4 right-4 p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
                    ${isActive 
                      ? 'bg-primary-50 text-primary-700 font-medium' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="px-4 py-4 border-t border-gray-200 space-y-1">
            {bottomItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
                    ${isActive 
                      ? 'bg-primary-50 text-primary-700 font-medium' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}
