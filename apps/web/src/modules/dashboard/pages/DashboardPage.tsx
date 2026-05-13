import React, { useState, useRef, useEffect, createContext, useContext, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, FileText, Github, Menu, X,
  Settings, LogOut, User, 
  Shield, BookOpen, Briefcase, Mic, Target,
  CheckCircle2, ArrowRight, HelpCircle, Moon, Sun, Globe, ZoomIn, Eye, ChevronRight
} from 'lucide-react';
import { Button } from '../../../components/ui';
import { useAuthStore } from '../../../store';

// ============ TRANSLATIONS ============
const translations = {
  en: {
    welcomeBack: 'Welcome back',
    hello: 'Hello',
    makingProgress: "You're making great progress. Here's what's waiting for you today.",
    yourProgress: 'Your Progress',
    profile: 'Profile',
    assessment: 'Assessment',
    interviewReady: 'Interview Ready',
    completed: 'Completed',
    inProgress: 'In progress',
    continueJourney: 'Continue your journey',
    getStarted: 'Get started',
    findJobs: 'Find Jobs',
    discoverStrengths: 'Discover your strengths',
    accessibleOpportunities: 'Accessible opportunities',
    practice: 'Practice',
    interviewWithAI: 'Interview with AI',
    roadmaps: 'Roadmaps',
    buildPath: 'Build your path',
    recentActivity: 'Recent Activity',
    viewAll: 'View all',
    assessmentCompleted: 'Assessment completed',
    careerInterests: 'Career interests identified',
    roadmapCreated: 'Roadmap created',
    softwareDevPath: 'Software Developer path',
    jobSaved: 'Job saved',
    recommendedForYou: 'Recommended for you',
    retake: 'Retake',
    growingDemand: 'Growing demand',
    steadyDemand: 'Steady demand',
    newOpportunity: 'New opportunity',
    exploreCareer: 'Explore career paths',
    yourJourneyUnique: 'Your journey is unique',
    supportMessage: 'Every career path has challenges and victories. We believe in your potential and are here to support you every step of the way.',
    signIn: 'Sign In',
    myProfile: 'My Profile',
    settings: 'Settings',
    helpSupport: 'Help & Support',
    signOut: 'Sign Out',
    accessibility: 'Accessibility',
    screenReader: 'Screen Reader',
    language: 'Language',
    textSize: 'Text Size',
    theme: 'Theme',
    optimized: 'Optimized',
    memberSince: 'Member since',
    recently: 'recently',
    wcagCompliant: 'WCAG 2.1 AA Compliant • Section 508 • EN 301 549',
    light: 'Light',
    dark: 'Dark',
    large: 'Large',
    medium: 'Medium',
    small: 'Small',
  },
  vi: {
    welcomeBack: 'Chào mừng trở lại',
    hello: 'Xin chào',
    makingProgress: 'Bạn đang tiến bộ rất tốt. Đây là những gì đang chờ đón bạn hôm nay.',
    yourProgress: 'Tiến độ của bạn',
    profile: 'Hồ sơ',
    assessment: 'Đánh giá',
    interviewReady: 'Sẵn sàng phỏng vấn',
    completed: 'Hoàn thành',
    inProgress: 'Đang tiến hành',
    continueJourney: 'Tiếp tục hành trình',
    getStarted: 'Bắt đầu ngay',
    findJobs: 'Tìm việc',
    discoverStrengths: 'Khám phá điểm mạnh',
    accessibleOpportunities: 'Cơ hội tiếp cận',
    practice: 'Luyện tập',
    interviewWithAI: 'Phỏng vấn với AI',
    roadmaps: 'Lộ trình',
    buildPath: 'Xây dựng con đường',
    recentActivity: 'Hoạt động gần đây',
    viewAll: 'Xem tất cả',
    assessmentCompleted: 'Đã hoàn thành đánh giá',
    careerInterests: 'Đã xác định sở thích nghề nghiệp',
    roadmapCreated: 'Đã tạo lộ trình',
    softwareDevPath: 'Lộ trình Lập trình viên',
    jobSaved: 'Đã lưu việc làm',
    recommendedForYou: 'Dành cho bạn',
    retake: 'Làm lại',
    growingDemand: 'Nhu cầu tăng',
    steadyDemand: 'Nhu cầu ổn định',
    newOpportunity: 'Cơ hội mới',
    exploreCareer: 'Khám phá lộ trình nghề nghiệp',
    yourJourneyUnique: 'Hành trình của bạn là duy nhất',
    supportMessage: 'Mỗi con đường nghề nghiệp đều có thử thách và thành công. Chúng tôi tin vào tiềm năng của bạn và luôn ở đây để hỗ trợ bạn.',
    signIn: 'Đăng nhập',
    myProfile: 'Hồ sơ của tôi',
    settings: 'Cài đặt',
    helpSupport: 'Trợ giúp',
    signOut: 'Đăng xuất',
    accessibility: 'Hỗ trợ tiếp cận',
    screenReader: 'Trình đọc màn hình',
    language: 'Ngôn ngữ',
    textSize: 'Cỡ chữ',
    theme: 'Giao diện',
    optimized: 'Đã tối ưu',
    memberSince: 'Tham gia từ',
    recently: 'gần đây',
    wcagCompliant: 'Tuân thủ WCAG 2.1 AA • Section 508 • EN 301 549',
    light: 'Sáng',
    dark: 'Tối',
    large: 'Lớn',
    medium: 'Trung bình',
    small: 'Nhỏ',
  }
};

// ============ CONTEXTS ============
type Theme = 'light' | 'dark';
type Lang = 'en' | 'vi';
type TextSize = 'small' | 'medium' | 'large';

interface AppState {
  theme: Theme;
  lang: Lang;
  textSize: TextSize;
  screenReader: boolean;
  setTheme: (theme: Theme) => void;
  setLang: (lang: Lang) => void;
  setTextSize: (size: TextSize) => void;
  setScreenReader: (enabled: boolean) => void;
  t: (key: keyof typeof translations.en) => string;
}

const AppContext = createContext<AppState>({
  theme: 'light',
  lang: 'en',
  textSize: 'medium',
  screenReader: false,
  setTheme: () => {},
  setLang: () => {},
  setTextSize: () => {},
  setScreenReader: () => {},
  t: () => '',
});

function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// ============ ANIMATION ============
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
};

// ============ NAVIGATION BAR ============
function Navbar() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { theme, lang, setTheme, setLang, t } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsDropdownOpen(false);
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/docs', label: 'Documentation', icon: FileText },
    { href: 'https://github.com', label: 'Github', icon: Github, external: true },
  ];

  const initials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'U';

  const isDark = theme === 'dark';
  const themeColors = isDark 
    ? { bg: 'bg-zinc-900', text: 'text-zinc-100', border: 'border-zinc-800', hover: 'hover:bg-zinc-800', accent: 'text-sky-400', muted: 'text-zinc-400', surface: 'bg-zinc-800', card: 'bg-zinc-800/80' }
    : { bg: 'bg-white', text: 'text-stone-900', border: 'border-stone-200', hover: 'hover:bg-stone-50', accent: 'text-sky-600', muted: 'text-stone-500', surface: 'bg-stone-100', card: 'bg-white' };

  const handleToggleTheme = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  const handleToggleLang = useCallback(() => {
    setLang(lang === 'en' ? 'vi' : 'en');
  }, [lang, setLang]);

  return (
    <nav className={`sticky top-0 z-50 ${themeColors.bg} ${themeColors.border} border-b backdrop-blur-sm ${isDark ? 'bg-zinc-900/95' : 'bg-white/95'}`}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className={`flex items-center gap-2 ${themeColors.text} font-bold text-2xl`}>
              <span>Avora</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.external ? '/' : item.href}
                  onClick={item.external ? () => window.open(item.href, '_blank') : undefined}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.href 
                      ? `${themeColors.accent} bg-sky-500/10` 
                      : `${themeColors.muted} ${themeColors.hover}`
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleTheme}
              className={`p-2 rounded-lg ${themeColors.hover} ${themeColors.muted} transition-colors`}
              aria-label={isDark ? t('light') : t('dark')}
              title={isDark ? t('light') : t('dark')}
            >
              <motion.div
                initial={false}
                animate={{ rotate: isDark ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.div>
            </button>

            <button
              onClick={handleToggleLang}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${themeColors.hover} ${themeColors.accent} transition-colors`}
            >
              {lang === 'en' ? '🇻🇳 VI' : '🇺🇸 EN'}
            </button>

            <div className="relative" ref={dropdownRef}>
              {isAuthenticated && user ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    aria-expanded={isDropdownOpen}
                    aria-haspopup="true"
                    className={`flex items-center p-1.5 rounded-xl ${themeColors.hover} transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500`}
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-zinc-700 shadow-sm" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center ring-2 ring-white dark:ring-zinc-700 shadow-sm">
                        <span className="text-white text-sm font-semibold">{initials}</span>
                      </div>
                    )}
                  </button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute right-0 mt-2 w-80 ${themeColors.card} rounded-2xl shadow-xl ${isDark ? 'shadow-black/50' : 'shadow-stone-900/15'} ${themeColors.border} ring-1 overflow-hidden z-50`}
                        style={{ maxHeight: 'calc(100vh - 80px)', overflowY: 'auto' }}
                      >
                        <div className={`px-5 py-4 ${isDark ? 'bg-zinc-800/50' : 'bg-gradient-to-r from-stone-50 to-white'} ${themeColors.border} border-b`}>
                          <div className="flex items-start gap-3">
                            {user.avatar ? (
                              <img src={user.avatar} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-white dark:ring-zinc-600 shadow-sm" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center ring-2 ring-white dark:ring-zinc-600 shadow-sm">
                                <span className="text-white text-base font-semibold">{initials}</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`font-semibold ${themeColors.text} truncate`}>{user.name || 'User'}</p>
                              <p className={`text-sm ${themeColors.muted} truncate`}>{user.email}</p>
                              <p className={`text-xs ${themeColors.muted} mt-0.5`}>
                                {t('memberSince')} {user.createdAt ? new Date(user.createdAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', year: 'numeric' }) : t('recently')}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className={`px-5 py-4 ${themeColors.border} border-b`}>
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div>
                              <p className={`text-lg font-bold ${themeColors.text}`}>75%</p>
                              <p className={`text-[10px] ${themeColors.muted}`}>{t('profile')}</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-emerald-500">100%</p>
                              <p className={`text-[10px] ${themeColors.muted}`}>{t('assessment')}</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-amber-500">45%</p>
                              <p className={`text-[10px] ${themeColors.muted}`}>{t('interviewReady')}</p>
                            </div>
                          </div>
                        </div>

                        <div className={`px-5 py-4 ${themeColors.border} border-b`}>
                          <div className="flex items-center gap-2 mb-3">
                            <Shield className="w-4 h-4 text-sky-500" />
                            <p className={`text-xs font-semibold ${themeColors.muted} uppercase tracking-wide`}>{t('accessibility')}</p>
                          </div>
                          <div className="space-y-2">
                            <button 
                              onClick={handleToggleTheme}
                              className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg ${isDark ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-stone-100 hover:bg-stone-200'} transition-colors`}
                            >
                              <div className="flex items-center gap-2">
                                {isDark ? <Sun className={`w-4 h-4 ${themeColors.muted}`} /> : <Moon className={`w-4 h-4 ${themeColors.muted}`} />}
                                <span className={`text-sm ${themeColors.text}`}>{t('theme')}</span>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-zinc-600 text-zinc-300' : 'bg-stone-200 text-stone-600'}`}>
                                {isDark ? t('dark') : t('light')}
                              </span>
                            </button>

                            <button 
                              onClick={handleToggleLang}
                              className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg ${isDark ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-stone-100 hover:bg-stone-200'} transition-colors`}
                            >
                              <div className="flex items-center gap-2">
                                <Globe className={`w-4 h-4 ${themeColors.muted}`} />
                                <span className={`text-sm ${themeColors.text}`}>{t('language')}</span>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-zinc-600 text-zinc-300' : 'bg-stone-200 text-stone-600'}`}>
                                {lang === 'en' ? 'English' : 'Tiếng Việt'}
                              </span>
                            </button>

                            <button 
                              className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg ${isDark ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-stone-100 hover:bg-stone-200'} transition-colors`}
                            >
                              <div className="flex items-center gap-2">
                                <ZoomIn className={`w-4 h-4 ${themeColors.muted}`} />
                                <span className={`text-sm ${themeColors.text}`}>{t('textSize')}</span>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-zinc-600 text-zinc-300' : 'bg-stone-200 text-stone-600'}`}>
                                Medium
                              </span>
                            </button>

                            <button 
                              className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg ${isDark ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-stone-100 hover:bg-stone-200'} transition-colors`}
                            >
                              <div className="flex items-center gap-2">
                                <Eye className={`w-4 h-4 ${themeColors.muted}`} />
                                <span className={`text-sm ${themeColors.text}`}>{t('screenReader')}</span>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-zinc-600 text-zinc-300' : 'bg-stone-200 text-stone-600'}`}>
                                {t('optimized')}
                              </span>
                            </button>
                          </div>
                          <p className={`text-[10px] ${themeColors.muted} mt-3`}>{t('wcagCompliant')}</p>
                        </div>

                        <div className="py-2">
                          <Link to="/profile" className={`flex items-center justify-between px-5 py-2.5 ${themeColors.hover} transition-colors`} onClick={() => setIsDropdownOpen(false)}>
                            <div className="flex items-center gap-3">
                              <User className={`w-4 h-4 ${themeColors.muted}`} />
                              <span className={`text-sm ${themeColors.text}`}>{t('myProfile')}</span>
                            </div>
                            <ChevronRight className={`w-4 h-4 ${themeColors.muted}`} />
                          </Link>
                          <Link to="/settings" className={`flex items-center justify-between px-5 py-2.5 ${themeColors.hover} transition-colors`} onClick={() => setIsDropdownOpen(false)}>
                            <div className="flex items-center gap-3">
                              <Settings className={`w-4 h-4 ${themeColors.muted}`} />
                              <span className={`text-sm ${themeColors.text}`}>{t('settings')}</span>
                            </div>
                            <ChevronRight className={`w-4 h-4 ${themeColors.muted}`} />
                          </Link>
                          <Link to="/help" className={`flex items-center justify-between px-5 py-2.5 ${themeColors.hover} transition-colors`} onClick={() => setIsDropdownOpen(false)}>
                            <div className="flex items-center gap-3">
                              <HelpCircle className={`w-4 h-4 ${themeColors.muted}`} />
                              <span className={`text-sm ${themeColors.text}`}>{t('helpSupport')}</span>
                            </div>
                            <ChevronRight className={`w-4 h-4 ${themeColors.muted}`} />
                          </Link>
                        </div>

                        <div className={`py-2 ${themeColors.border} border-t`}>
                          <button
                            onClick={() => { setIsDropdownOpen(false); logout(); }}
                            className="flex items-center gap-3 w-full px-5 py-2.5 hover:bg-red-500/10 transition-colors text-left"
                          >
                            <LogOut className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-red-500">{t('signOut')}</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <Link to="/login">
                  <Button variant="outline" size="sm" className={isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-stone-200 text-stone-600 hover:bg-stone-50'}>
                    {t('signIn')}
                  </Button>
                </Link>
              )}
            </div>

            <button
              className={`md:hidden p-2 rounded-lg ${themeColors.hover} ${themeColors.muted}`}
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              <motion.div
                initial={false}
                animate={{ rotate: isOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </motion.div>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`md:hidden py-4 ${themeColors.border} border-t`}
            >
              {navItems.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={item.external ? '/' : item.href}
                    onClick={() => { setIsOpen(false); if (item.external) window.open(item.href, '_blank'); }}
                    className={`flex items-center gap-3 px-4 py-3 ${themeColors.muted} ${themeColors.hover} rounded-lg`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

// ============ PROGRESS RING ============
function ProgressRing({ progress, size = 72, strokeWidth = 5, color = '#0ea5e9' }: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-stone-200 dark:text-zinc-700" />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        strokeLinecap="round"
      />
    </svg>
  );
}

// ============ STAT CARD ============
function StatCard({ label, value, progress, color, delay, variant = 0 }: { 
  label: string; value: number; progress: number; color: string; delay: number; variant?: number; 
}) {
  const { theme, t } = useApp();
  const isDark = theme === 'dark';
  
  const accentColors: Record<number, string> = {
    0: 'from-sky-500/10 to-transparent',
    1: 'from-emerald-500/10 to-transparent',
    2: 'from-amber-500/10 to-transparent',
  };

  return (
    <motion.div
      {...fadeUp}
      transition={{ ...fadeUp.transition, delay }}
      className={`relative overflow-hidden ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-stone-100'} border rounded-2xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group`}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${accentColors[variant]} rounded-full -translate-y-1/2 translate-x-1/3 opacity-50 group-hover:opacity-70 transition-opacity`} />
      
      <div className="relative flex items-center gap-4">
        <div className="relative">
          <ProgressRing progress={progress} color={color} />
          <span className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${isDark ? 'text-zinc-100' : 'text-stone-800'}`}>{value}%</span>
        </div>
        <div>
          <p className={`font-semibold ${isDark ? 'text-zinc-100' : 'text-stone-800'}`}>{label}</p>
          <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-stone-500'} mt-0.5`}>
            {progress === 100 ? t('completed') : t('inProgress')}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ============ QUICK ACTION ============
function QuickAction({ icon: Icon, title, description, link, accentColor, delay }: {
  icon: React.ElementType; title: string; description: string; link: string; accentColor: string; delay: number;
}) {
  const { theme, t } = useApp();
  const isDark = theme === 'dark';

  return (
    <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay }}>
      <Link
        to={link}
        className={`group block h-full ${isDark ? 'bg-zinc-800/80 border-zinc-700 hover:border-zinc-600' : 'bg-white border-stone-100 hover:border-stone-200'} border rounded-2xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
      >
        <div className="flex items-start gap-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 shadow-lg"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            <Icon className="w-6 h-6" style={{ color: accentColor }} />
          </div>
          <div className="flex-1">
            <h3 className={`font-semibold ${isDark ? 'text-zinc-100' : 'text-stone-800'} mb-1 group-hover:text-sky-400 dark:group-hover:text-sky-400 transition-colors`}>{title}</h3>
            <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-stone-500'} mb-3`}>{description}</p>
            <div className={`inline-flex items-center gap-1.5 text-sm font-medium text-sky-500`}>
              <span>{t('getStarted')}</span>
              <motion.div
                initial={{ x: 0 }}
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
                className="flex items-center"
              >
                <ArrowRight className="w-4 h-4" />
              </motion.div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ============ ACTIVITY ITEM ============
function ActivityItem({ title, description, time, completed, delay }: { title: string; description: string; time: string; completed: boolean; delay: number }) {
  const { theme } = useApp();
  const isDark = theme === 'dark';

  return (
    <motion.div 
      {...fadeUp}
      transition={{ ...fadeUp.transition, delay }}
      className={`flex items-start gap-4 p-4 rounded-xl ${isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-stone-50'} transition-colors`}
    >
      <motion.div 
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          completed 
            ? 'bg-emerald-500/20 text-emerald-500' 
            : isDark ? 'bg-zinc-700 text-zinc-500' : 'bg-stone-200 text-stone-400'
        }`}
        initial={completed ? { scale: 0.8 } : false}
        animate={completed ? { scale: 1 } : false}
      >
        {completed ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-2.5 h-2.5 rounded-full bg-current" />}
      </motion.div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${isDark ? 'text-zinc-100' : 'text-stone-800'}`}>{title}</p>
        <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-stone-500'} truncate`}>{description}</p>
      </div>
      <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-stone-400'} whitespace-nowrap`}>{time}</span>
    </motion.div>
  );
}

// ============ CAREER CARD ============
function CareerCard({ title, match, trend, delay }: { title: string; match: number; trend: 'up' | 'stable' | 'new'; delay: number }) {
  const { theme, t } = useApp();
  const isDark = theme === 'dark';
  
  const trendConfig = {
    up: { label: t('growingDemand'), color: 'text-emerald-500 bg-emerald-500/15', icon: '↗' },
    stable: { label: t('steadyDemand'), color: isDark ? 'text-zinc-400 bg-zinc-700' : 'text-stone-600 bg-stone-100', icon: '→' },
    new: { label: t('newOpportunity'), color: 'text-sky-500 bg-sky-500/15', icon: '★' }
  };

  return (
    <motion.div 
      {...fadeUp} 
      transition={{ ...fadeUp.transition, delay }}
      className={`group p-4 ${isDark ? 'bg-zinc-800/80 border-zinc-700 hover:border-zinc-600' : 'bg-white border-stone-100 hover:border-stone-200'} border rounded-xl hover:shadow-lg transition-all duration-300 cursor-pointer`}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className={`font-medium ${isDark ? 'text-zinc-100' : 'text-stone-800'} group-hover:text-sky-400 transition-colors`}>{title}</h4>
        <motion.span 
          className="text-sm font-bold text-emerald-500"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        >
          {match}%
        </motion.span>
      </div>
      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${trendConfig[trend].color}`}>
        <span>{trendConfig[trend].icon}</span>
        {trendConfig[trend].label}
      </span>
    </motion.div>
  );
}

// ============ MAIN DASHBOARD ============
export default function DashboardPage() {
  const { user } = useAuthStore();
  const [theme, setTheme] = useState<Theme>('light');
  const [lang, setLang] = useState<Lang>('en');
  const [textSize, setTextSize] = useState<TextSize>('medium');
  const [screenReader, setScreenReader] = useState(false);

  const t = useCallback((key: keyof typeof translations.en): string => {
    return translations[lang][key] || translations.en[key] || key;
  }, [lang]);

  const appState: AppState = {
    theme,
    lang,
    textSize,
    screenReader,
    setTheme,
    setLang,
    setTextSize,
    setScreenReader,
    t,
  };

  const firstName = user?.name?.split(' ')[0] || (lang === 'vi' ? 'bạn' : 'there');

  const isDark = theme === 'dark';
  const themeColors = isDark 
    ? { bg: 'bg-zinc-900', text: 'text-zinc-100', muted: 'text-zinc-400', border: 'border-zinc-800', card: 'bg-zinc-800', section: 'text-zinc-100' }
    : { bg: 'bg-stone-50', text: 'text-stone-900', muted: 'text-stone-500', border: 'border-stone-200', card: 'bg-white', section: 'text-stone-800' };

  return (
    <AppContext.Provider value={appState}>
      <div className={`min-h-screen ${themeColors.bg} ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>
        <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] -translate-y-1/2 translate-x-1/4">
            <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? 'from-sky-500/[0.03]' : 'from-sky-100/50'} via-transparent to-transparent rounded-full`} />
          </div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] translate-y-1/2 -translate-x-1/3">
            <div className={`absolute inset-0 bg-gradient-to-tr ${isDark ? 'from-emerald-500/[0.02]' : 'from-emerald-50/30'} via-transparent to-transparent rounded-full`} />
          </div>
        </div>

        <Navbar />

        <main className="relative max-w-5xl mx-auto px-6 py-10">
          <motion.header {...fadeUp} className="mb-10">
            <div>
              <motion.p 
                className={`${themeColors.muted} text-sm mb-2`}
                key={`welcome-${lang}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {t('welcomeBack')}
              </motion.p>
              <motion.h1 
                className={`text-3xl sm:text-4xl font-bold ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}
                key={`hello-${lang}-${firstName}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {t('hello')}, {firstName}
              </motion.h1>
              <motion.p 
                className={`${themeColors.muted} mt-3 text-base max-w-lg leading-relaxed`}
                key={`progress-${lang}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {t('makingProgress')}
              </motion.p>
            </div>
          </motion.header>

          <section aria-labelledby="progress-heading" className="mb-10">
            <motion.h2 
              id="progress-heading" 
              className={`sr-only ${isDark ? 'text-zinc-100' : 'text-stone-800'}`}
            >
              {t('yourProgress')}
            </motion.h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label={t('profile')} value={75} progress={75} color="#0ea5e9" delay={0.1} variant={0} />
              <StatCard label={t('assessment')} value={100} progress={100} color="#22c55e" delay={0.2} variant={1} />
              <StatCard label={t('interviewReady')} value={45} progress={45} color="#f59e0b" delay={0.3} variant={2} />
            </div>
          </section>

          <section aria-labelledby="actions-heading" className="mb-10">
            <motion.h2 
              id="actions-heading" 
              className={`text-xl font-semibold ${themeColors.section} mb-5`}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.15 }}
            >
              {t('continueJourney')}
            </motion.h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <QuickAction icon={BookOpen} title={t('assessment')} description={t('discoverStrengths')} link="/assessment" accentColor="#0ea5e9" delay={0.2} />
              <QuickAction icon={Briefcase} title={t('findJobs')} description={t('accessibleOpportunities')} link="/jobs" accentColor="#22c55e" delay={0.3} />
              <QuickAction icon={Mic} title={t('practice')} description={t('interviewWithAI')} link="/interviews" accentColor="#a855f7" delay={0.4} />
              <QuickAction icon={Target} title={t('roadmaps')} description={t('buildPath')} link="/roadmaps" accentColor="#f59e0b" delay={0.5} />
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            <section aria-labelledby="activity-heading">
              <div className="flex items-center justify-between mb-4">
                <motion.h2 
                  id="activity-heading" 
                  className={`text-lg font-semibold ${themeColors.section}`}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: 0.2 }}
                >
                  {t('recentActivity')}
                </motion.h2>
                <motion.button 
                  className={`text-sm text-sky-500 hover:text-sky-400 font-medium`}
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.15 }}
                >
                  {t('viewAll')}
                </motion.button>
              </div>
              <motion.div 
                className={`${themeColors.card} ${isDark ? 'border-zinc-700' : 'border-stone-100'} border rounded-2xl overflow-hidden shadow-sm`}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: 0.25 }}
              >
                <ActivityItem title={t('assessmentCompleted')} description={t('careerInterests')} time={lang === 'vi' ? '2 giờ trước' : '2h ago'} completed={true} delay={0.2} />
                <ActivityItem title={t('roadmapCreated')} description={t('softwareDevPath')} time={lang === 'vi' ? '1 ngày trước' : '1d ago'} completed={true} delay={0.3} />
                <ActivityItem title={t('jobSaved')} description="UX Designer at TechCorp" time={lang === 'vi' ? '3 ngày trước' : '3d ago'} completed={false} delay={0.4} />
              </motion.div>
            </section>

            <section aria-labelledby="careers-heading">
              <div className="flex items-center justify-between mb-4">
                <motion.h2 
                  id="careers-heading" 
                  className={`text-lg font-semibold ${themeColors.section}`}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: 0.3 }}
                >
                  {t('recommendedForYou')}
                </motion.h2>
                <Link to="/assessment" className="text-sm text-sky-500 hover:text-sky-400 font-medium">
                  {t('retake')}
                </Link>
              </div>
              <div className="space-y-3">
                <CareerCard title="Software Developer" match={92} trend="up" delay={0.35} />
                <CareerCard title="UX Designer" match={85} trend="stable" delay={0.4} />
                <CareerCard title="Technical Writer" match={78} trend="new" delay={0.45} />
              </div>
              <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.5 }} className="mt-4">
                <Link to="/roadmaps">
                  <Button 
                    variant="outline" 
                    className={`w-full gap-2 ${isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-stone-200 text-stone-600 hover:bg-stone-50'}`}
                  >
                    {t('exploreCareer')}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </motion.div>
            </section>
          </div>

          <motion.section 
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.55 }}
            className={`p-6 ${isDark ? 'bg-zinc-800/50 border-zinc-700' : 'bg-gradient-to-r from-sky-50 to-stone-50 border-stone-100'} border rounded-2xl shadow-sm`}
          >
            <div className="flex items-start gap-4">
              <motion.div 
                className={`w-12 h-12 ${isDark ? 'bg-sky-500/20' : 'bg-sky-100'} rounded-xl flex items-center justify-center flex-shrink-0`}
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <Shield className={`w-6 h-6 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
              </motion.div>
              <div>
                <h3 className={`font-semibold ${themeColors.text} mb-1.5`}>{t('yourJourneyUnique')}</h3>
                <p className={`${themeColors.muted} text-sm leading-relaxed`}>{t('supportMessage')}</p>
              </div>
            </div>
          </motion.section>
        </main>
      </div>
    </AppContext.Provider>
  );
}
