import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Menu, Search, Settings, User } from 'lucide-react';
import { useAuthStore } from '../../store';

interface HeaderProps {
  onMenuClick: () => void;
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'Tổng quan',
  '/profile': 'Hồ sơ',
  '/assessment': 'Đánh giá nghề nghiệp',
  '/jobs': 'Việc làm trợ năng',
  '/roadmaps': 'Lộ trình',
  '/interviews': 'Phỏng vấn',
  '/confidence': 'Tự tin',
  '/simulation': 'Mô phỏng',
  '/settings': 'Cài đặt',
};

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const title = pageTitles[location.pathname] || 'Không gian làm việc';
  const initials = user?.name
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/90 backdrop-blur-xl" role="banner">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onMenuClick}
            className="interactive-button inline-flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 text-stone-600 hover:border-sky-200 hover:bg-stone-100 hover:text-stone-950 lg:hidden"
            aria-label="Mở điều hướng"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">Không gian Avora</p>
            <h1 className="truncate text-xl font-bold text-stone-950">{title}</h1>
          </div>
        </div>

        <div className="group hidden max-w-md flex-1 items-center rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 transition-all duration-200 ease-out hover:border-sky-200 hover:bg-white hover:shadow-sm focus-within:border-sky-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-400/25 lg:flex">
          <Search className="interactive-icon h-4 w-4 text-stone-400 group-focus-within:text-primary-600" />
          <input
            type="search"
            placeholder="Tìm việc làm, lộ trình, phỏng vấn..."
            className="w-full bg-transparent px-3 text-sm text-stone-700 outline-none placeholder:text-stone-400"
            aria-label="Tìm trong không gian làm việc"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="interactive-button hidden h-10 w-10 items-center justify-center rounded-xl border border-stone-200 text-stone-500 hover:border-sky-200 hover:bg-stone-100 hover:text-stone-950 sm:inline-flex"
            aria-label="Thông báo"
          >
            <Bell className="h-5 w-5" />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((value) => !value)}
              className="interactive-button group flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-2 py-1.5 shadow-sm hover:border-sky-200 hover:bg-stone-50 hover:shadow-md"
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              <div className="interactive-icon flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-sm font-bold text-primary-700 group-hover:scale-105 group-hover:bg-primary-200">
                {initials}
              </div>
              <div className="hidden min-w-0 text-left sm:block">
                <p className="max-w-[140px] truncate text-sm font-semibold text-stone-900">{user?.name || 'Người dùng'}</p>
                <p className="max-w-[140px] truncate text-xs text-stone-500">{user?.email || 'Đã đăng nhập'}</p>
              </div>
              <ChevronDown className={`interactive-icon hidden h-4 w-4 text-stone-400 sm:block ${userMenuOpen ? 'rotate-180 text-primary-600' : 'group-hover:text-stone-700'}`} />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl shadow-stone-900/10">
                <div className="border-b border-stone-100 px-4 py-3">
                  <p className="truncate font-semibold text-stone-900">{user?.name || 'Người dùng'}</p>
                  <p className="truncate text-sm text-stone-500">{user?.email}</p>
                </div>

                <div className="p-2">
                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="interactive-button flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 hover:text-stone-950"
                  >
                    <User className="h-4 w-4" />
                    Hồ sơ
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="interactive-button flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 hover:text-stone-950"
                  >
                    <Settings className="h-4 w-4" />
                    Cài đặt
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setUserMenuOpen(false);
                    }}
                    className="interactive-button flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <LogOut className="h-4 w-4" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
