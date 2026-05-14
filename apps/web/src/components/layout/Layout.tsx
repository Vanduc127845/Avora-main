import React from 'react';
import { Outlet } from 'react-router-dom';
import AgentContextBanner from '../ai/AgentContextBanner';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-stone-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-xl focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>

      <div className="flex min-h-screen">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main
            className="flex-1 px-4 py-6 sm:px-6 lg:px-8"
            role="main"
            id="main-content"
          >
            <div className="mx-auto max-w-7xl">
              <AgentContextBanner />
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
