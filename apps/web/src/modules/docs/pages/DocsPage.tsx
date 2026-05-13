import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, Home, Search, Menu, X, ExternalLink, Github,
  ChevronRight, ChevronDown, Copy, Check, ArrowRight, Moon, Sun
} from 'lucide-react';
import { useAuthStore } from '../../../store';

// ============ TYPES ============
type Lang = 'en' | 'vi';
type Theme = 'light' | 'dark';

// ============ CHECK ICON COMPONENT ============
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ============ TRANSLATIONS ============
const translations = {
  en: {
    home: 'Home',
    documentation: 'Documentation',
    github: 'Github',
    signIn: 'Sign In',
    searchDocs: 'Search documentation...',
    
    gettingStarted: 'Getting Started',
    introduction: 'Introduction',
    quickstart: 'Quickstart',
    installation: 'Installation',
    configuration: 'Configuration',
    
    coreFeatures: 'Core Features',
    assessments: 'Assessments',
    interviews: 'AI Interviews',
    roadmaps: 'Career Roadmaps',
    jobs: 'Job Matching',
    
    accessibility: 'Accessibility',
    accessibilityStandards: 'Accessibility Standards',
    wcag: 'WCAG 2.1 AA',
    section508: 'Section 508',
    en301549: 'EN 301 549',
    
    developers: 'For Developers',
    apiReference: 'API Reference',
    authentication: 'Authentication',
    webhooks: 'Webhooks',
    
    support: 'Support',
    community: 'Community',
    contact: 'Contact Us',
    
    prevPage: 'Previous',
    nextPage: 'Next',
    tableOfContents: 'On this page',
    copyCode: 'Copy code',
    copied: 'Copied!',
  },
  vi: {
    home: 'Trang chủ',
    documentation: 'Tài liệu',
    github: 'Github',
    signIn: 'Đăng nhập',
    searchDocs: 'Tìm kiếm tài liệu...',
    
    gettingStarted: 'Bắt đầu',
    introduction: 'Giới thiệu',
    quickstart: 'Hướng dẫn nhanh',
    installation: 'Cài đặt',
    configuration: 'Cấu hình',
    
    coreFeatures: 'Tính năng chính',
    assessments: 'Đánh giá',
    interviews: 'Phỏng vấn AI',
    roadmaps: 'Lộ trình nghề nghiệp',
    jobs: 'Tìm việc',
    
    accessibility: 'Hỗ trợ tiếp cận',
    accessibilityStandards: 'Tiêu chuẩn tiếp cận',
    wcag: 'WCAG 2.1 AA',
    section508: 'Section 508',
    en301549: 'EN 301 549',
    
    developers: 'Dành cho nhà phát triển',
    apiReference: 'Tài liệu API',
    authentication: 'Xác thực',
    webhooks: 'Webhooks',
    
    support: 'Hỗ trợ',
    community: 'Cộng đồng',
    contact: 'Liên hệ',
    
    prevPage: 'Trước',
    nextPage: 'Tiếp',
    tableOfContents: 'Trên trang này',
    copyCode: 'Sao chép',
    copied: 'Đã sao chép!',
  }
};

// ============ NAVIGATION DATA ============
const allSections = [
  'introduction', 'quickstart', 'installation', 'configuration',
  'assessments', 'interviews', 'roadmaps', 'jobs',
  'wcag', 'section-508', 'en-301549',
  'api', 'authentication', 'webhooks'
];

const navigation = {
  en: [
    {
      title: 'Getting Started',
      items: [
        { id: 'introduction', label: 'Introduction' },
        { id: 'quickstart', label: 'Quickstart' },
        { id: 'installation', label: 'Installation' },
        { id: 'configuration', label: 'Configuration' },
      ]
    },
    {
      title: 'Core Features',
      items: [
        { id: 'assessments', label: 'Assessments' },
        { id: 'interviews', label: 'AI Interviews' },
        { id: 'roadmaps', label: 'Career Roadmaps' },
        { id: 'jobs', label: 'Job Matching' },
      ]
    },
    {
      title: 'Accessibility',
      items: [
        { id: 'wcag', label: 'WCAG 2.1 AA' },
        { id: 'section-508', label: 'Section 508' },
        { id: 'en-301549', label: 'EN 301 549' },
      ]
    },
    {
      title: 'For Developers',
      items: [
        { id: 'api', label: 'API Reference' },
        { id: 'authentication', label: 'Authentication' },
        { id: 'webhooks', label: 'Webhooks' },
      ]
    },
  ],
  vi: [
    {
      title: 'Bắt đầu',
      items: [
        { id: 'introduction', label: 'Giới thiệu' },
        { id: 'quickstart', label: 'Hướng dẫn nhanh' },
        { id: 'installation', label: 'Cài đặt' },
        { id: 'configuration', label: 'Cấu hình' },
      ]
    },
    {
      title: 'Tính năng chính',
      items: [
        { id: 'assessments', label: 'Đánh giá' },
        { id: 'interviews', label: 'Phỏng vấn AI' },
        { id: 'roadmaps', label: 'Lộ trình nghề nghiệp' },
        { id: 'jobs', label: 'Tìm việc' },
      ]
    },
    {
      title: 'Hỗ trợ tiếp cận',
      items: [
        { id: 'wcag', label: 'WCAG 2.1 AA' },
        { id: 'section-508', label: 'Section 508' },
        { id: 'en-301549', label: 'EN 301 549' },
      ]
    },
    {
      title: 'Dành cho nhà phát triển',
      items: [
        { id: 'api', label: 'Tài liệu API' },
        { id: 'authentication', label: 'Xác thực' },
        { id: 'webhooks', label: 'Webhooks' },
      ]
    },
  ]
};

// ============ CODE BLOCK COMPONENT ============
function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-6">
      <div className={`absolute top-0 left-4 px-2 py-0.5 text-xs font-medium rounded-bl-lg rounded-br-lg ${language === 'bash' ? 'bg-stone-600 text-stone-300' : 'bg-sky-600 text-sky-100'} opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
        {language}
      </div>
      <pre className={`${language === 'bash' ? 'bg-zinc-900 text-zinc-100' : 'bg-stone-900 text-stone-100'} rounded-xl p-4 overflow-x-auto text-sm leading-relaxed`}>
        <code>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className={`absolute top-3 right-3 p-2 rounded-lg transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600 hover:text-white'} opacity-0 group-hover:opacity-100`}
        aria-label={copied ? 'Copied!' : 'Copy code'}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ============ MAIN DOCS PAGE ============
export default function DocsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [lang, setLang] = useState<Lang>('en');
  const [theme, setTheme] = useState<Theme>('light');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['Getting Started', 'Core Features']);
  const [activeSection, setActiveSection] = useState('introduction');
  const [searchQuery, setSearchQuery] = useState('');

  const t = (key: keyof typeof translations.en): string => 
    translations[lang][key] || translations.en[key] || key;

  const isDark = theme === 'dark';
  
  // Dynamic hover classes based on theme
  const hoverClass = isDark ? 'hover:text-zinc-100' : 'hover:text-stone-900';
  const themeColors = isDark 
    ? { bg: 'bg-zinc-950', text: 'text-zinc-100', muted: 'text-zinc-400', border: 'border-zinc-800', accent: 'text-sky-400', surface: 'bg-zinc-900', card: 'bg-zinc-900', tocHover: 'hover:text-zinc-200' }
    : { bg: 'bg-white', text: 'text-stone-900', muted: 'text-stone-500', border: 'border-stone-200', accent: 'text-sky-600', surface: 'bg-stone-50', card: 'bg-stone-50', tocHover: 'hover:text-stone-700' };

  const currentNav = navigation[lang];

  // Get prev/next section info
  const { prevSection, nextSection, prevIndex, nextIndex } = useMemo(() => {
    const currentIndex = allSections.indexOf(activeSection);
    return {
      prevSection: currentIndex > 0 ? allSections[currentIndex - 1] : null,
      nextSection: currentIndex < allSections.length - 1 ? allSections[currentIndex + 1] : null,
      prevIndex: currentIndex > 0 ? currentIndex - 1 : -1,
      nextIndex: currentIndex < allSections.length - 1 ? currentIndex + 1 : -1,
    };
  }, [activeSection]);

  // Find section label
  const getSectionLabel = (sectionId: string): string => {
    for (const navSection of currentNav) {
      const item = navSection.items.find(i => i.id === sectionId);
      if (item) return item.label;
    }
    return sectionId;
  };

  const toggleSection = (title: string) => {
    setExpandedSections(prev => 
      prev.includes(title) ? prev.filter(s => s !== title) : [...prev, title]
    );
  };

  const handleNavClick = (id: string) => {
    setActiveSection(id);
    setMobileNavOpen(false);
  };

  const handlePrev = () => {
    if (prevSection) setActiveSection(prevSection);
  };

  const handleNext = () => {
    if (nextSection) setActiveSection(nextSection);
  };

  return (
    <div className={`min-h-screen ${themeColors.bg}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 ${themeColors.surface} ${themeColors.border} border-b backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-6">
              <Link to="/" className={`flex items-center gap-2 ${themeColors.text} font-bold text-xl`}>
                <span>Avora</span>
              </Link>
              
              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-1">
                <Link to="/" className={`px-3 py-1.5 rounded-lg text-sm ${themeColors.muted} ${hoverClass} transition-colors`}>
                  {t('home')}
                </Link>
                <Link to="/docs" className={`px-3 py-1.5 rounded-lg text-sm ${themeColors.accent} bg-sky-500/10 font-medium`}>
                  {t('documentation')}
                </Link>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${themeColors.muted} ${hoverClass} transition-colors`}>
                  <Github className="w-4 h-4" />
                  {t('github')}
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              </nav>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setTheme(isDark ? 'light' : 'dark')} 
                className={`p-2 rounded-lg ${hoverClass} ${themeColors.muted}`}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => setLang(l => l === 'en' ? 'vi' : 'en')} 
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${hoverClass} ${themeColors.accent}`}
                aria-label="Switch language"
              >
                {lang === 'en' ? 'VI' : 'EN'}
              </button>
              <button 
                onClick={() => setMobileNavOpen(!mobileNavOpen)} 
                className={`md:hidden p-2 rounded-lg ${hoverClass} ${themeColors.muted}`}
                aria-label="Toggle menu"
                aria-expanded={mobileNavOpen}
              >
                {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex gap-8 py-8">
          {/* Sidebar Navigation */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <nav className="sticky top-20 space-y-6">
              {/* Search */}
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${themeColors.muted}`} />
                <input
                  type="text"
                  placeholder={t('searchDocs')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label={t('searchDocs')}
                  className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500' : 'bg-white border-stone-200 text-stone-900 placeholder:text-stone-400'} border focus:outline-none focus:ring-2 focus:ring-sky-500/50`}
                />
              </div>

              {/* Navigation Sections */}
              {currentNav.map((section) => (
                <div key={section.title}>
                  <button
                    onClick={() => toggleSection(section.title)}
                    aria-expanded={expandedSections.includes(section.title)}
                    className={`flex items-center justify-between w-full text-xs font-semibold uppercase tracking-wider ${themeColors.muted} mb-2 ${hoverClass}`}
                  >
                    <span>{section.title}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedSections.includes(section.title) ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedSections.includes(section.title) && (
                    <ul className="space-y-0.5">
                      {section.items.map((item) => (
                        <li key={item.id}>
                          <button
                            onClick={() => handleNavClick(item.id)}
                            className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                              activeSection === item.id 
                                ? `${themeColors.accent} bg-sky-500/10 font-medium` 
                                : `${themeColors.muted} ${hoverClass}`
                            }`}
                          >
                            <ChevronRight className={`w-3.5 h-3.5 transition-opacity ${activeSection === item.id ? 'opacity-100' : 'opacity-0'}`} />
                            {item.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </nav>
          </aside>

          {/* Mobile Navigation */}
          {mobileNavOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`lg:hidden absolute left-0 right-0 top-14 ${themeColors.surface} ${themeColors.border} border-b p-4 z-40`}
            >
              <nav className="space-y-4">
                {currentNav.map((section) => (
                  <div key={section.title}>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${themeColors.muted} mb-2`}>{section.title}</p>
                    <ul className="space-y-1 ml-2">
                      {section.items.map((item) => (
                        <li key={item.id}>
                          <button
                            onClick={() => handleNavClick(item.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm ${activeSection === item.id ? `${themeColors.accent} font-medium` : themeColors.muted}`}
                          >
                            {item.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>
            </motion.div>
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0 max-w-3xl">
            {/* Introduction */}
            {activeSection === 'introduction' && (
              <motion.article
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className={`text-3xl font-bold ${themeColors.text} mb-4`}>Introduction to Avora</h1>
                <p className={`text-lg ${themeColors.muted} mb-6`}>
                  Avora is an AI-powered career development platform designed to help users discover their potential, prepare for interviews, and find accessible job opportunities.
                </p>
                
                <h2 className={`text-xl font-semibold ${themeColors.text} mt-8 mb-4`}>What is Avora?</h2>
                <p className={`${themeColors.muted} mb-4`}>
                  Our platform combines psychological assessments, AI-generated interview practice, and personalized career roadmaps to create a comprehensive career development experience. We believe everyone deserves access to tools that help them succeed in their career journey.
                </p>
                
                <h2 className={`text-xl font-semibold ${themeColors.text} mt-8 mb-4`}>Key Features</h2>
                <ul className={`space-y-2 ${themeColors.muted} list-disc list-inside`}>
                  <li>AI-powered career assessments</li>
                  <li>Practice interviews with AI</li>
                  <li>Personalized learning roadmaps</li>
                  <li>Accessible job matching</li>
                  <li>Multi-language support (English & Vietnamese)</li>
                </ul>

                <div className={`mt-8 p-4 rounded-xl ${isDark ? 'bg-sky-500/10 border border-sky-500/20' : 'bg-sky-50 border border-sky-100'}`}>
                  <p className={`text-sm ${themeColors.accent} font-medium`}>Note</p>
                  <p className={`text-sm ${themeColors.muted} mt-1`}>
                    Avora is built with accessibility as a core principle, following WCAG 2.1 AA, Section 508, and EN 301 549 standards.
                  </p>
                </div>
              </motion.article>
            )}

            {/* Quickstart */}
            {activeSection === 'quickstart' && (
              <motion.article
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className={`text-3xl font-bold ${themeColors.text} mb-4`}>Quickstart</h1>
                <p className={`text-lg ${themeColors.muted} mb-6`}>
                  Get up and running with Avora in just a few minutes.
                </p>

                <h2 className={`text-xl font-semibold ${themeColors.text} mt-8 mb-4`}>Step 1: Create an Account</h2>
                <p className={`${themeColors.muted} mb-4`}>
                  Sign up using your email or social accounts like Google or GitHub.
                </p>

                <CodeBlock code={`# Sign up with email
curl -X POST https://api.avora.com/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com", "password": "your-password"}'`} />

                <h2 className={`text-xl font-semibold ${themeColors.text} mt-8 mb-4`}>Step 2: Complete Assessment</h2>
                <p className={`${themeColors.muted} mb-4`}>
                  Take our career aptitude assessment to discover your strengths and interests.
                </p>

                <CodeBlock code={`# Start assessment
curl -X POST https://api.avora.com/assessments \\
  -H "Authorization: Bearer YOUR_TOKEN"`} />

                <h2 className={`text-xl font-semibold ${themeColors.text} mt-8 mb-4`}>Step 3: Build Your Roadmap</h2>
                <p className={`${themeColors.muted} mb-4`}>
                  Receive personalized learning paths based on your assessment results.
                </p>

                <CodeBlock code={`# Get personalized roadmap
curl -X GET https://api.avora.com/roadmaps \\
  -H "Authorization: Bearer YOUR_TOKEN"`} />
              </motion.article>
            )}

            {/* Installation */}
            {activeSection === 'installation' && (
              <motion.article
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className={`text-3xl font-bold ${themeColors.text} mb-4`}>Installation</h1>
                <p className={`text-lg ${themeColors.muted} mb-6`}>
                  Set up Avora in your development environment.
                </p>

                <h2 className={`text-xl font-semibold ${themeColors.text} mt-8 mb-4`}>Prerequisites</h2>
                <ul className={`space-y-2 ${themeColors.muted} list-disc list-inside`}>
                  <li>Node.js 18.0 or higher</li>
                  <li>npm or yarn package manager</li>
                  <li>Supabase account (for database)</li>
                </ul>

                <h2 className={`text-xl font-semibold ${themeColors.text} mt-8 mb-4`}>Clone the Repository</h2>
                <CodeBlock code={`git clone https://github.com/your-org/avora.git
cd avora`} />

                <h2 className={`text-xl font-semibold ${themeColors.text} mt-8 mb-4`}>Install Dependencies</h2>
                <CodeBlock code={`npm install`} />

                <h2 className={`text-xl font-semibold ${themeColors.text} mt-8 mb-4`}>Environment Setup</h2>
                <CodeBlock code={`# Create .env file
cp .env.example .env

# Fill in your credentials
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key`} />
              </motion.article>
            )}

            {/* Configuration */}
            {activeSection === 'configuration' && (
              <motion.article
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className={`text-3xl font-bold ${themeColors.text} mb-4`}>Configuration</h1>
                <p className={`text-lg ${themeColors.muted} mb-6`}>
                  Configure Avora for your specific needs.
                </p>

                <h2 className={`text-xl font-semibold ${themeColors.text} mt-8 mb-4`}>Environment Variables</h2>
                <CodeBlock code={`# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# AI Configuration  
OPENAI_API_KEY=sk-your-openai-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000`} language="env" />

                <h2 className={`text-xl font-semibold ${themeColors.text} mt-8 mb-4`}>Accessibility Settings</h2>
                <p className={`${themeColors.muted} mb-4`}>
                  Avora supports various accessibility configurations to ensure everyone can use the platform.
                </p>
                <CodeBlock code={`// In your app configuration
const accessibilitySettings = {
  fontSize: 100,        // 100-150%
  highContrast: false,
  reducedMotion: false,
  voiceNavigation: false,
  keyboardOnly: false,
  screenReaderOptimized: true,
};`} language="javascript" />
              </motion.article>
            )}

            {/* Assessments */}
            {activeSection === 'assessments' && (
              <motion.article
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className={`text-3xl font-bold ${themeColors.text} mb-4`}>Assessments</h1>
                <p className={`text-lg ${themeColors.muted} mb-6`}>
                  AI-powered career aptitude tests to help discover your strengths and interests.
                </p>

                <h2 className={`text-xl font-semibold ${themeColors.text} mt-8 mb-4`}>How It Works</h2>
                <p className={`${themeColors.muted} mb-4`}>
                  Our assessment system uses a combination of psychological principles and AI analysis to provide personalized career recommendations.
                </p>

                <div className="grid gap-4 mt-6">
                  <div className={`p-4 rounded-xl ${themeColors.card}`}>
                    <h3 className={`font-semibold ${themeColors.text} mb-2`}>1. Interest Questionnaire</h3>
                    <p className={`text-sm ${themeColors.muted}`}>Answer questions about your interests, values, and work preferences.</p>
                  </div>
                  <div className={`p-4 rounded-xl ${themeColors.card}`}>
                    <h3 className={`font-semibold ${themeColors.text} mb-2`}>2. Skills Assessment</h3>
                    <p className={`text-sm ${themeColors.muted}`}>Evaluate your current skills and identify areas for growth.</p>
                  </div>
                  <div className={`p-4 rounded-xl ${themeColors.card}`}>
                    <h3 className={`font-semibold ${themeColors.text} mb-2`}>3. AI Analysis</h3>
                    <p className={`text-sm ${themeColors.muted}`}>Our AI analyzes your responses to generate personalized recommendations.</p>
                  </div>
                </div>

                <CodeBlock code={`# Get assessment results
curl -X GET https://api.avora.com/assessments/:id \\
  -H "Authorization: Bearer YOUR_TOKEN"`} />
              </motion.article>
            )}

            {/* Interviews */}
            {activeSection === 'interviews' && (
              <motion.article
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className={`text-3xl font-bold ${themeColors.text} mb-4`}>AI Interviews</h1>
                <p className={`text-lg ${themeColors.muted} mb-6`}>
                  Practice job interviews with our AI interviewer and receive instant feedback.
                </p>

                <h2 className={`text-xl font-semibold ${themeColors.text} mt-8 mb-4`}>Features</h2>
                <ul className={`space-y-2 ${themeColors.muted} list-disc list-inside`}>
                  <li>Realistic interview simulations</li>
                  <li>Personalized questions based on your target role</li>
                  <li>Instant feedback on your responses</li>
                  <li>Analysis of tone, clarity, and content</li>
                  <li>Multiple interview formats (behavioral, technical, case)</li>
                </ul>

                <CodeBlock code={`# Start interview session
curl -X POST https://api.avora.com/interviews \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"type": "behavioral", "target_role": "Software Engineer"}'`} />
              </motion.article>
            )}

            {/* Roadmaps */}
            {activeSection === 'roadmaps' && (
              <motion.article
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className={`text-3xl font-bold ${themeColors.text} mb-4`}>Career Roadmaps</h1>
                <p className={`text-lg ${themeColors.muted} mb-6`}>
                  Personalized learning paths to help you reach your career goals.
                </p>

                <h2 className={`text-xl font-semibold ${themeColors.text} mt-8 mb-4`}>Roadmap Structure</h2>
                <p className={`${themeColors.muted} mb-4`}>
                  Each roadmap contains milestones, learning resources, and practical exercises tailored to your assessment results.
                </p>

                <CodeBlock code={`# Get user's roadmaps
curl -X GET https://api.avora.com/roadmaps \\
  -H "Authorization: Bearer YOUR_TOKEN"`} />

                <CodeBlock code={`# Update roadmap progress
curl -X PATCH https://api.avora.com/roadmaps/:id/progress \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"milestone_id": "ms_123", "completed": true}'`} />
              </motion.article>
            )}

            {/* Jobs */}
            {activeSection === 'jobs' && (
              <motion.article
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className={`text-3xl font-bold ${themeColors.text} mb-4`}>Job Matching</h1>
                <p className={`text-lg ${themeColors.muted} mb-6`}>
                  Find accessible job opportunities that match your skills and preferences.
                </p>

                <h2 className={`text-xl font-semibold ${themeColors.text} mt-8 mb-4`}>How It Works</h2>
                <p className={`${themeColors.muted} mb-4`}>
                  Our job matching algorithm considers your profile, assessment results, and accessibility needs to find the best-fit positions.
                </p>

                <CodeBlock code={`# Search jobs
curl -X GET "https://api.avora.com/jobs?query=developer&location=remote" \\
  -H "Authorization: Bearer YOUR_TOKEN"`} />

                <CodeBlock code={`# Save a job
curl -X POST https://api.avora.com/jobs/:id/save \\
  -H "Authorization: Bearer YOUR_TOKEN"`} />
              </motion.article>
            )}

            {/* WCAG */}
            {activeSection === 'wcag' && (
              <motion.article
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className={`text-3xl font-bold ${themeColors.text} mb-4`}>WCAG 2.1 AA Compliance</h1>
                <p className={`text-lg ${themeColors.muted} mb-6`}>
                  Avora is designed to meet Web Content Accessibility Guidelines 2.1 Level AA standards.
                </p>

                <h2 className={`text-xl font-semibold ${themeColors.text} mt-8 mb-4`}>Key Requirements Met</h2>
                <ul className={`space-y-3 ${themeColors.muted}`}>
                  <li className="flex items-start gap-3">
                    <CheckIcon className={`w-5 h-5 ${themeColors.accent} flex-shrink-0 mt-0.5`} />
                    <div>
                      <strong className={themeColors.text}>Perceivable</strong>
                      <p className="text-sm mt-1">All content is available to users with disabilities, including screen reader users.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckIcon className={`w-5 h-5 ${themeColors.accent} flex-shrink-0 mt-0.5`} />
                    <div>
                      <strong className={themeColors.text}>Operable</strong>
                      <p className="text-sm mt-1">Full keyboard navigation and voice control support.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckIcon className={`w-5 h-5 ${themeColors.accent} flex-shrink-0 mt-0.5`} />
                    <div>
                      <strong className={themeColors.text}>Understandable</strong>
                      <p className="text-sm mt-1">Clear, consistent navigation and error identification.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckIcon className={`w-5 h-5 ${themeColors.accent} flex-shrink-0 mt-0.5`} />
                    <div>
                      <strong className={themeColors.text}>Robust</strong>
                      <p className="text-sm mt-1">Compatible with assistive technologies and standards-compliant.</p>
                    </div>
                  </li>
                </ul>
              </motion.article>
            )}

            {/* Section 508 */}
            {activeSection === 'section-508' && (
              <motion.article
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className={`text-3xl font-bold ${themeColors.text} mb-4`}>Section 508</h1>
                <p className={`text-lg ${themeColors.muted} mb-6`}>
                  Compliant with US federal accessibility requirements under Section 508 of the Rehabilitation Act.
                </p>

                <h2 className={`text-xl font-semibold ${themeColors.text} mt-8 mb-4`}>Applicable Standards</h2>
                <p className={`${themeColors.muted} mb-4`}>
                  Avora conforms to the Web-based Intranet and Internet Information and Applications (WCAG 2.0) standards incorporated by reference in Section 508.
                </p>
              </motion.article>
            )}

            {/* EN 301 549 */}
            {activeSection === 'en-301549' && (
              <motion.article
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className={`text-3xl font-bold ${themeColors.text} mb-4`}>EN 301 549</h1>
                <p className={`text-lg ${themeColors.muted} mb-6`}>
                  European accessibility standard for ICT products and services.
                </p>

                <h2 className={`text-xl font-semibold ${themeColors.text} mt-8 mb-4`}>Compliance</h2>
                <p className={`${themeColors.muted} mb-4`}>
                  Avora meets the requirements of EN 301 549, ensuring accessibility for users across the European Union and other regions that recognize this standard.
                </p>
              </motion.article>
            )}

            {/* API Reference */}
            {activeSection === 'api' && (
              <motion.article
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className={`text-3xl font-bold ${themeColors.text} mb-4`}>API Reference</h1>
                <p className={`text-lg ${themeColors.muted} mb-6`}>
                  RESTful API documentation for Avora integration.
                </p>

                <h2 className={`text-xl font-semibold ${themeColors.text} mt-8 mb-4`}>Base URL</h2>
                <CodeBlock code={`https://api.avora.com/v1`} />

                <h2 className={`text-xl font-semibold ${themeColors.text} mt-8 mb-4`}>Authentication</h2>
                <p className={`${themeColors.muted} mb-4`}>
                  All API requests require authentication using Bearer tokens.
                </p>
                <CodeBlock code={`curl -X GET https://api.avora.com/v1/user \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json"`} />
              </motion.article>
            )}

            {/* Authentication */}
            {activeSection === 'authentication' && (
              <motion.article
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className={`text-3xl font-bold ${themeColors.text} mb-4`}>Authentication</h1>
                <p className={`text-lg ${themeColors.muted} mb-6`}>
                  Secure authentication using OAuth 2.0 and Supabase.
                </p>

                <h2 className={`text-xl font-semibold ${themeColors.text} mt-8 mb-4`}>Supported Providers</h2>
                <ul className={`space-y-2 ${themeColors.muted} list-disc list-inside`}>
                  <li>Email / Password</li>
                  <li>Google OAuth</li>
                  <li>GitHub OAuth</li>
                </ul>

                <h2 className={`text-xl font-semibold ${themeColors.text} mt-8 mb-4`}>Login Example</h2>
                <CodeBlock code={`curl -X POST https://api.avora.com/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com", "password": "password"}'`} />

                <h2 className={`text-xl font-semibold ${themeColors.text} mt-8 mb-4`}>Token Refresh</h2>
                <CodeBlock code={`curl -X POST https://api.avora.com/auth/refresh \\
  -H "Content-Type: application/json" \\
  -d '{"refresh_token": "your-refresh-token"}'`} />
              </motion.article>
            )}

            {/* Webhooks */}
            {activeSection === 'webhooks' && (
              <motion.article
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className={`text-3xl font-bold ${themeColors.text} mb-4`}>Webhooks</h1>
                <p className={`text-lg ${themeColors.muted} mb-6`}>
                  Real-time event notifications for your applications.
                </p>

                <h2 className={`text-xl font-semibold ${themeColors.text} mt-8 mb-4`}>Available Events</h2>
                <ul className={`space-y-2 ${themeColors.muted} list-disc list-inside`}>
                  <li><code className={`px-1.5 py-0.5 rounded ${isDark ? 'bg-zinc-800' : 'bg-stone-100'} text-sm`}>assessment.completed</code> - When an assessment is finished</li>
                  <li><code className={`px-1.5 py-0.5 rounded ${isDark ? 'bg-zinc-800' : 'bg-stone-100'} text-sm`}>interview.ended</code> - When an interview session ends</li>
                  <li><code className={`px-1.5 py-0.5 rounded ${isDark ? 'bg-zinc-800' : 'bg-stone-100'} text-sm`}>roadmap.updated</code> - When roadmap progress changes</li>
                  <li><code className={`px-1.5 py-0.5 rounded ${isDark ? 'bg-zinc-800' : 'bg-stone-100'} text-sm`}>job.matched</code> - When new jobs match user profile</li>
                </ul>

                <CodeBlock code={`// Example webhook payload
{
  "event": "assessment.completed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "user_id": "usr_123",
    "assessment_id": "ast_456",
    "result": { }
  }
}`} language="json" />
              </motion.article>
            )}

            {/* Navigation Footer */}
            <div className={`flex items-center justify-between mt-12 pt-8 border-t ${themeColors.border}`}>
              <button 
                onClick={handlePrev}
                disabled={!prevSection}
                className={`flex items-center gap-2 text-sm transition-opacity ${
                  prevSection 
                    ? `${themeColors.muted} ${hoverClass} cursor-pointer` 
                    : 'opacity-30 cursor-not-allowed'
                }`}
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                <span>{prevSection ? getSectionLabel(prevSection) : t('prevPage')}</span>
              </button>
              <button 
                onClick={handleNext}
                disabled={!nextSection}
                className={`flex items-center gap-2 text-sm transition-opacity ${
                  nextSection 
                    ? `${themeColors.accent} ${hoverClass} cursor-pointer` 
                    : 'opacity-30 cursor-not-allowed'
                }`}
              >
                <span>{nextSection ? getSectionLabel(nextSection) : t('nextPage')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </main>

          {/* Right Sidebar - Table of Contents */}
          <aside className="hidden xl:block w-48 flex-shrink-0">
            <div className="sticky top-20">
              <p className={`text-xs font-semibold uppercase tracking-wider ${themeColors.muted} mb-3`}>{t('tableOfContents')}</p>
              <ul className="space-y-2">
                {currentNav.map((section) => (
                  section.items.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => handleNavClick(item.id)}
                        className={`text-sm w-full text-left py-1 transition-colors ${activeSection === item.id ? themeColors.accent : `${themeColors.muted} ${themeColors.tocHover}`}`}
                      >
                        {item.label}
                      </button>
                    </li>
                  ))
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className={`border-t ${themeColors.border} mt-12`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center">
                <Shield className="w-3 h-3 text-white" />
              </div>
              <span className={`text-sm ${themeColors.muted}`}>Avora © {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className={`text-sm ${themeColors.muted} ${hoverClass} transition-colors`}>Privacy Policy</a>
              <a href="#" className={`text-sm ${themeColors.muted} ${hoverClass} transition-colors`}>Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
