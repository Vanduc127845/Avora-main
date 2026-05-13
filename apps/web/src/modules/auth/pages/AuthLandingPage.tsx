import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, Shield, Sparkles, Users, Heart, ChevronRight, 
  Star, Compass, CheckCircle, Accessibility, Eye, EyeOff
} from 'lucide-react';
import { Button } from '../../../components/ui';

const fadeUp = {
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
};

const floatAnimation = (duration = 6, y = 14) => ({
  animate: {
    y: [0, -y, 0],
    transition: { duration, repeat: Infinity, ease: 'easeInOut' },
  },
});

const trustItems = [
  {
    icon: Shield,
    label: 'Bank-level security',
    description: 'Your career data stays private and protected',
    color: '#0ea5e9',
  },
  {
    icon: Sparkles,
    label: 'Smart guidance',
    description: 'AI that adapts to your unique needs',
    color: '#a855f7',
  },
  {
    icon: Users,
    label: 'Built for all',
    description: 'Screen reader friendly, keyboard navigable',
    color: '#22c55e',
  },
  {
    icon: Heart,
    label: 'Real support',
    description: 'Human help whenever you need it',
    color: '#f43f5e',
  },
];

const currentYear = new Date().getFullYear();

export default function AuthLandingPage() {
  return (
    <div className="min-h-screen bg-[#fefcfa] flex flex-col relative overflow-hidden">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-6 focus:py-3 focus:bg-[#0369a1] focus:text-white focus:rounded-xl focus:font-semibold focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* === DECORATIVE BACKGROUND LAYER === */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        
        {/* Warm gradient orbs */}
        <div className="absolute -top-20 -right-20 w-[450px] h-[450px]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#bae6fd] via-[#e0f2fe] to-[#f0f9ff] rounded-full opacity-60" />
        </div>
        
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px]">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#fef3c7]/40 via-[#fef9c3]/20 to-transparent rounded-full opacity-50" />
        </div>

        {/* Abstract wave shapes */}
        <svg className="absolute top-[10%] right-[5%] w-[200px] h-[200px] opacity-20" viewBox="0 0 200 200">
          <path
            d="M100,20 Q150,60 180,100 T180,180 Q140,140 100,180 T20,180 Q60,140 100,100 T100,20"
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>

        {/* Floating accessibility symbol */}
        <motion.div
          className="absolute top-[30%] left-[8%]"
          {...floatAnimation(8, 12)}
        >
          <Accessibility className="w-12 h-12 text-[#0ea5e9]/10" />
        </motion.div>

        {/* Decorative circles */}
        <motion.div
          className="absolute top-[15%] right-[20%]"
          {...floatAnimation(6, 10)}
        >
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border border-[#0ea5e9]/15 rounded-full" />
            <div className="absolute inset-2 border border-[#0ea5e9]/10 rounded-full" />
          </div>
        </motion.div>

        <motion.div
          className="absolute bottom-[25%] right-[10%]"
          {...floatAnimation(5, 8)}
        >
          <div className="w-10 h-10 bg-[#f59e0b]/8 rounded-full" />
        </motion.div>

        <motion.div
          className="absolute bottom-[35%] left-[15%]"
          {...floatAnimation(7, 12)}
        >
          <div className="w-8 h-8 border-2 border-[#22c55e]/15 rounded-lg rotate-45" />
        </motion.div>

        {/* Scattered checkmarks */}
        <motion.div 
          className="absolute top-[20%] left-[30%]"
          animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <CheckCircle className="w-5 h-5 text-[#22c55e]/30" />
        </motion.div>

        <motion.div 
          className="absolute top-[45%] right-[25%]"
          animate={{ opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1.5 }}
        >
          <CheckCircle className="w-4 h-4 text-[#0ea5e9]/25" />
        </motion.div>

        <motion.div 
          className="absolute bottom-[40%] left-[35%]"
          animate={{ opacity: [0.2, 0.35, 0.2], rotate: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity, delay: 2 }}
        >
          <Star className="w-5 h-5 text-[#f59e0b]/25 fill-[#f59e0b]/10" />
        </motion.div>

        {/* Subtle dot grid */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(circle, #1c1917 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }} />

        {/* Soft horizontal lines */}
        <div className="absolute top-[60%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#e7e5e4]/50 to-transparent" />
        <div className="absolute bottom-[40%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#e7e5e4]/30 to-transparent" />

      </div>

      {/* === HEADER === */}
      <header className="relative z-10 border-b border-[#e7e5e4]/70 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-11 h-11 bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] rounded-xl flex items-center justify-center shadow-lg shadow-[#0ea5e9]/20"
              role="img"
              aria-label="AI Career Copilot logo"
            >
              <span className="text-white font-bold text-sm tracking-wide">AI</span>
            </div>
            <div>
              <span className="font-semibold text-[#1c1917] text-lg">AI Career Copilot</span>
              <p className="text-xs text-[#78716c] mt-0.5">Your inclusive career companion</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-3" aria-label="Authentication navigation">
            <Link
              to="/login"
              className="min-h-[44px] px-5 py-2.5 text-[#57534e] hover:text-[#1c1917] font-medium transition-colors rounded-lg hover:bg-[#fafaf9] focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/50 flex items-center"
            >
              Sign in
            </Link>
            <Link to="/login">
              <Button 
                size="sm"
                className="min-h-[44px] bg-[#0ea5e9] hover:bg-[#0284c7] text-white shadow-md font-medium focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/50 focus:ring-offset-2"
              >
                Get started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* === HERO CONTENT === */}
      <main id="main-content" className="relative z-10 flex-1 flex items-center justify-center py-20 lg:py-28 px-6">
        <motion.div 
          {...fadeUp}
          className="max-w-2xl mx-auto text-center"
        >
          
          {/* Accessibility badge */}
          <div 
            className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-full shadow-sm border border-[#e7e5e4] mb-8"
            role="status"
            aria-label="Accessibility commitment"
          >
            <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" aria-hidden="true" />
            <span className="text-sm font-medium text-[#44403c]">
              Built with accessibility in mind
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-display font-medium leading-[1.1] tracking-tight text-[#1c1917] mb-7">
            Your career journey
            <br />
            <span className="text-[#0284c7]">starts here</span>
          </h1>

          <p className="text-lg lg:text-xl text-[#57534e] mb-10 max-w-lg mx-auto leading-relaxed">
            Get personalized career guidance designed to work with your needs. 
            We'll help you build skills, explore options, and reach your goals.
          </p>

          {/* CTA Buttons - Large touch targets with clear next steps */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link to="/login" className="contents">
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group min-h-[52px] inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-semibold rounded-xl shadow-lg shadow-[#0ea5e9]/25 text-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:ring-offset-2"
              >
                Start your free account
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </motion.button>
            </Link>
            <Link to="/login" className="contents">
              <button className="min-h-[52px] inline-flex items-center justify-center px-8 py-4 border-2 border-[#d6d3d1] text-[#57534e] font-semibold rounded-xl hover:bg-[#fafaf9] hover:border-[#a8a29e] text-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/50 focus:ring-offset-2">
                Sign in to your account
              </button>
            </Link>
          </div>

          {/* Next step hint */}
          <p className="text-sm text-[#78716c] mb-12">
            Takes 2 minutes. No credit card required.
          </p>

          {/* Trust & Value Cards - with descriptions */}
          <section aria-labelledby="trust-heading">
            <h2 id="trust-heading" className="sr-only">What you can expect</h2>
            <ul className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-xl mx-auto">
              {trustItems.map((item, i) => (
                <motion.li
                  key={item.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                >
                  <article className="p-5 bg-white rounded-2xl border border-[#e7e5e4] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 h-full flex flex-col">
                    <div 
                      className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 mx-auto"
                      style={{ backgroundColor: `${item.color}15` }}
                    >
                      <item.icon className="w-5 h-5" style={{ color: item.color }} aria-hidden="true" />
                    </div>
                    <h3 className="font-semibold text-[#1c1917] text-sm mb-1">{item.label}</h3>
                    <p className="text-xs text-[#78716c] leading-relaxed">{item.description}</p>
                  </article>
                </motion.li>
              ))}
            </ul>
          </section>
        </motion.div>
      </main>

      {/* === ACCESSIBILITY STATEMENT === */}
      <section 
        className="relative z-10 py-10 bg-[#f0f9ff]/50 border-y border-[#e0f2fe]"
        aria-labelledby="accessibility-heading"
      >
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Accessibility className="w-5 h-5 text-[#0284c7]" aria-hidden="true" />
            <h2 id="accessibility-heading" className="text-lg font-semibold text-[#1c1917]">
              Our accessibility promise
            </h2>
          </div>
          <p className="text-[#57534e] text-sm leading-relaxed mb-4">
            We believe career guidance should be available to everyone. Our platform works with 
            screen readers, keyboard navigation, and voice control. If you need any help getting started, 
            our support team is here for you.
          </p>
          <Link 
            to="/accessibility" 
            className="inline-flex items-center gap-1 text-sm font-medium text-[#0284c7] hover:text-[#0369a1] transition-colors focus:outline-none focus:underline"
          >
            Learn about our accessibility features <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* === VALUE STRIP === */}
      <section className="relative z-10 py-5 bg-white/70 backdrop-blur-sm border-y border-[#e7e5e4]/50">
        <div className="max-w-4xl mx-auto px-6">
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-[#57534e]">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" aria-hidden="true" />
              <span>Free to start</span>
            </li>
            <li className="hidden sm:block w-px h-4 bg-[#d6d3d1]" aria-hidden="true" />
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9]" aria-hidden="true" />
              <span>No credit card needed</span>
            </li>
            <li className="hidden sm:block w-px h-4 bg-[#d6d3d1]" aria-hidden="true" />
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" aria-hidden="true" />
              <span>Cancel anytime</span>
            </li>
          </ul>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="relative z-10 py-7 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-[#78716c]">
            <Compass className="w-4 h-4 text-[#0284c7]" aria-hidden="true" />
            <span>Built with care for everyone</span>
          </div>
          <nav className="flex items-center gap-5 text-sm text-[#a8a29e]" aria-label="Footer navigation">
            <Link to="/privacy" className="hover:text-[#57534e] transition-colors focus:outline-none focus:underline">Privacy</Link>
            <Link to="/terms" className="hover:text-[#57534e] transition-colors focus:outline-none focus:underline">Terms</Link>
            <Link to="/help" className="hover:text-[#57534e] transition-colors focus:outline-none focus:underline">Help</Link>
            <Link to="/accessibility" className="hover:text-[#57534e] transition-colors focus:outline-none focus:underline">Accessibility</Link>
          </nav>
          <p className="text-sm text-[#a8a29e]">
            &copy; {currentYear} AI Career Copilot
          </p>
        </div>
      </footer>
    </div>
  );
}
