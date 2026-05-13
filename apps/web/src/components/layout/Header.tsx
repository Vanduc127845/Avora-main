import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, User, LogOut, Settings } from 'lucide-react';
import { useAuthStore } from '../../store';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  return (
    <header 
      className="bg-white border-b border-gray-200 sticky top-0 z-40"
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            <Link to="/" className="flex items-center gap-2 ml-2 lg:ml-0">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="hidden sm:block font-semibold text-gray-900">
                Career Copilot
              </span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-6" role="navigation" aria-label="Main navigation">
            <Link to="/dashboard" className="text-gray-600 hover:text-primary-600 transition-colors">
              Dashboard
            </Link>
            <Link to="/jobs" className="text-gray-600 hover:text-primary-600 transition-colors">
              Jobs
            </Link>
            <Link to="/roadmaps" className="text-gray-600 hover:text-primary-600 transition-colors">
              Roadmaps
            </Link>
            <Link to="/interviews" className="text-gray-600 hover:text-primary-600 transition-colors">
              Interviews
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-medium text-sm">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="hidden sm:block text-gray-700 font-medium">
                    {user?.name || 'User'}
                  </span>
                </button>

                {userMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="font-medium text-gray-900">{user?.name}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>
                      <Link 
                        to="/profile" 
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                      <Link 
                        to="/settings" 
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button
                          onClick={() => {
                            logout();
                            setUserMenuOpen(false);
                          }}
                          className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 w-full transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="btn-primary"
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
