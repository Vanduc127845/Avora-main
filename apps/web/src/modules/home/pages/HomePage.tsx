import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Sparkles, Shield,
  Eye, Cpu, Star, Zap,
  GraduationCap, MessageCircle,
  TrendingUp, Heart, Globe, ExternalLink, Moon, Sun,
  Brain, FileText, Target, Bell, User
} from 'lucide-react';
import { Button } from '../../../components/ui';
import { IMAGES } from '../../../utils/images';

type Theme = 'light' | 'dark';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// ============ HERO CHAT SIMULATION COMPONENTS ============

const ChatMessage = ({ role, content, delay = 0, isDark }: { role: 'user' | 'ai'; content: string; delay?: number; isDark: boolean }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3, delay }}
    className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}
  >
    <div className={`flex items-end gap-2 max-w-[85%] ${role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
      <motion.div 
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
          role === 'ai'
            ? isDark ? 'border-sky-400/30 bg-sky-500/15 text-sky-300' : 'border-sky-200 bg-sky-50 text-sky-600'
            : isDark ? 'border-zinc-600 bg-zinc-800 text-zinc-200' : 'border-stone-200 bg-stone-100 text-stone-600'
        }`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, delay: delay + 0.1 }}
      >
        {role === 'ai' ? <Sparkles className="h-4 w-4" /> : <User className="h-4 w-4" />}
      </motion.div>
      <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed min-h-[2.5rem] flex items-center ${
        role === 'ai'
          ? isDark 
            ? 'bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-bl-md shadow-sm'
            : 'bg-white border border-stone-200 text-stone-900 rounded-bl-md shadow-sm'
          : 'bg-sky-500 text-white rounded-br-md shadow-sm'
      }`}>
        <span>{content}</span>
      </div>
    </div>
  </motion.div>
);

const TypingIndicator = ({ isDark }: { isDark: boolean }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }} 
    transition={{ duration: 0.2 }}
    className="flex items-center gap-2"
  >
    <motion.div 
      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
        isDark ? 'border-sky-400/30 bg-sky-500/15 text-sky-300' : 'border-sky-200 bg-sky-50 text-sky-600'
      }`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <Sparkles className="h-4 w-4" />
    </motion.div>
    <div className={`px-4 py-3 rounded-2xl rounded-bl-md shadow-sm min-h-[2.5rem] flex items-center ${isDark ? 'bg-zinc-800 border border-zinc-700' : 'bg-white border border-stone-200'}`}>
      <div className="flex gap-1">
        <motion.div className="w-2 h-2 bg-sky-500 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0 }} />
        <motion.div className="w-2 h-2 bg-sky-500 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }} />
        <motion.div className="w-2 h-2 bg-sky-500 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }} />
      </div>
    </div>
  </motion.div>
);

const FloatingParticles = ({ isDark }: { isDark: boolean }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 rounded-full"
        style={{
          backgroundColor: i % 2 === 0 ? '#0ea5e9' : '#0284c7',
          opacity: 0.15,
          left: `${15 + i * 15}%`,
          top: `${20 + (i % 3) * 25}%`,
        }}
        animate={{ y: [0, -15, 0], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
      />
    ))}
  </div>
);

// ============ ANIMATED BACKGROUND EFFECTS ============

const AnimatedGradient = ({ isDark }: { isDark: boolean }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    <motion.div
      className="absolute inset-0"
      animate={{
        background: isDark
          ? [
              'linear-gradient(135deg, #09090b 0%, #18181b 50%, #09090b 100%)',
              'linear-gradient(145deg, #09090b 0%, #1f1f23 50%, #09090b 100%)',
              'linear-gradient(125deg, #09090b 0%, #18181b 50%, #09090b 100%)',
              'linear-gradient(135deg, #09090b 0%, #18181b 50%, #09090b 100%)',
            ]
          : [
              'linear-gradient(135deg, #f0f9ff 0%, #fafafa 50%, #f5f5f4 100%)',
              'linear-gradient(145deg, #f0f9ff 0%, #f8fafc 50%, #f5f5f4 100%)',
              'linear-gradient(125deg, #f0f9ff 0%, #fafafa 50%, #f5f5f4 100%)',
              'linear-gradient(135deg, #f0f9ff 0%, #fafafa 50%, #f5f5f4 100%)',
            ],
      }}
      transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
    />
  </div>
);

const FloatingLightBlobs = ({ isDark }: { isDark: boolean }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    {/* Primary blob - top left */}
    <motion.div
      className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
      style={{ top: '5%', left: '-10%', filter: 'blur(100px)' }}
      animate={{
        y: [0, -50, 0],
        x: [0, 20, 0],
        opacity: [0.12, 0.18, 0.12],
        scale: [1, 1.1, 1],
      }}
      transition={{ duration: 16, repeat: Infinity, delay: 0, ease: 'easeInOut' }}
    >
      <div
        className="w-full h-full rounded-full"
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(14, 165, 233, 0.35) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(14, 165, 233, 0.2) 0%, transparent 70%)',
        }}
      />
    </motion.div>

    {/* Secondary blob - top right */}
    <motion.div
      className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
      style={{ top: '15%', right: '-5%', filter: 'blur(90px)' }}
      animate={{
        y: [0, -40, 0],
        x: [0, -15, 0],
        opacity: [0.1, 0.16, 0.1],
        scale: [1, 1.08, 1],
      }}
      transition={{ duration: 14, repeat: Infinity, delay: 3, ease: 'easeInOut' }}
    >
      <div
        className="w-full h-full rounded-full"
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(56, 189, 248, 0.3) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)',
        }}
      />
    </motion.div>

    {/* Tertiary blob - bottom */}
    <motion.div
      className="absolute w-[350px] h-[350px] rounded-full pointer-events-none"
      style={{ bottom: '10%', left: '20%', filter: 'blur(80px)' }}
      animate={{
        y: [0, 35, 0],
        x: [0, 10, 0],
        opacity: [0.08, 0.14, 0.08],
        scale: [1, 1.12, 1],
      }}
      transition={{ duration: 18, repeat: Infinity, delay: 5, ease: 'easeInOut' }}
    >
      <div
        className="w-full h-full rounded-full"
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%)',
        }}
      />
    </motion.div>

    {/* Accent blob - center glow */}
    <motion.div
      className="absolute w-64 h-64 rounded-full pointer-events-none"
      style={{
        top: '40%',
        right: '20%',
        filter: 'blur(120px)',
      }}
      animate={{
        opacity: [0.05, 0.1, 0.05],
        scale: [1, 1.15, 1],
      }}
      transition={{ duration: 20, repeat: Infinity, delay: 2, ease: 'easeInOut' }}
    >
      <div
        className="w-full h-full rounded-full"
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%)',
        }}
      />
    </motion.div>

    {/* Small accent - bottom right */}
    <motion.div
      className="absolute w-32 h-32 rounded-full pointer-events-none"
      style={{ bottom: '25%', right: '10%', filter: 'blur(60px)' }}
      animate={{
        y: [0, -25, 0],
        opacity: [0.06, 0.1, 0.06],
      }}
      transition={{ duration: 12, repeat: Infinity, delay: 7, ease: 'easeInOut' }}
    >
      <div
        className="w-full h-full rounded-full"
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(34, 211, 238, 0.2) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(34, 211, 238, 0.1) 0%, transparent 70%)',
        }}
      />
    </motion.div>
  </div>
);

const FloatingIcons = ({ isDark }: { isDark: boolean }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div className="absolute -left-4 top-1/3" animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
      <Cpu className={`w-5 h-5 ${isDark ? 'text-sky-400/20' : 'text-sky-500/20'}`} />
    </motion.div>
    <motion.div className="absolute -right-4 top-1/4" animate={{ y: [0, 12, 0], rotate: [0, -5, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}>
      <Eye className={`w-6 h-6 ${isDark ? 'text-sky-400/20' : 'text-sky-500/20'}`} />
    </motion.div>
    <motion.div className="absolute -left-6 bottom-1/4" animate={{ y: [0, 8, 0], x: [0, 3, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}>
      <Star className={`w-4 h-4 ${isDark ? 'text-amber-400/20' : 'text-amber-500/20'}`} />
    </motion.div>
    <motion.div className="absolute -right-8 bottom-1/3" animate={{ y: [0, -8, 0], x: [0, -2, 0] }} transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}>
      <Zap className={`w-5 h-5 ${isDark ? 'text-emerald-400/20' : 'text-emerald-500/20'}`} />
    </motion.div>
  </div>
);

const WaveAnimation = ({ isDark }: { isDark: boolean }) => (
  <div className="absolute -bottom-1 left-0 right-0 h-8 overflow-hidden">
    <svg className="absolute w-full h-full" viewBox="0 0 1200 60" preserveAspectRatio="none">
      <motion.path
        d="M0,30 Q150,0 300,30 T600,30 T900,30 T1200,30 L1200,60 L0,60 Z"
        fill={isDark ? '#18181b' : '#fafaf9'}
        animate={{ d: [
          "M0,30 Q150,0 300,30 T600,30 T900,30 T1200,30 L1200,60 L0,60 Z",
          "M0,30 Q150,60 300,30 T600,30 T900,30 T1200,30 L1200,60 L0,60 Z",
          "M0,30 Q150,0 300,30 T600,30 T900,30 T1200,30 L1200,60 L0,60 Z",
        ] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M0,35 Q150,5 300,35 T600,35 T900,35 T1200,35 L1200,60 L0,60 Z"
        fill={isDark ? '#27272a' : '#f5f5f4'}
        animate={{ d: [
          "M0,35 Q150,5 300,35 T600,35 T900,35 T1200,35 L1200,60 L0,60 Z",
          "M0,35 Q150,65 300,35 T600,35 T900,35 T1200,35 L1200,60 L0,60 Z",
          "M0,35 Q150,5 300,35 T600,35 T900,35 T1200,35 L1200,60 L0,60 Z",
        ] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
      />
    </svg>
  </div>
);

const ChatInterface = ({ isDark }: { isDark: boolean }) => {
  const [showTyping, setShowTyping] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const messages = [
    { role: 'ai' as const, content: 'Chào bạn, mình là Avora. Bạn muốn tìm việc, học kỹ năng mới, hay luyện phỏng vấn trước?' },
    { role: 'user' as const, content: 'Mình muốn học frontend và cần công việc linh hoạt.' },
    { role: 'ai' as const, content: 'Mình sẽ gợi ý lộ trình React cơ bản, bài tập nhỏ để làm portfolio, và các vị trí remote phù hợp.' },
    { role: 'user' as const, content: 'Mình nên bắt đầu từ bước nào?' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      if (messageIndex < messages.length) {
        if (messageIndex === messages.length - 1) {
          setShowTyping(true);
          setIsLooping(true);
          // After showing typing, reset after delay to loop
          setTimeout(() => {
            setShowTyping(false);
            setMessageIndex(0);
            setIsLooping(false);
          }, 3500);
        } else {
          setMessageIndex(prev => prev + 1);
        }
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [messageIndex, messages.length, isLooping]);

  // Auto-scroll to bottom when new message appears
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messageIndex, showTyping]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 30, scale: 0.95 }} 
      animate={{ opacity: 1, x: 0, scale: 1 }} 
      transition={{ duration: 0.8, delay: 0.5 }} 
      className="relative"
    >
      {/* Soft glow behind the chat */}
      <motion.div 
        className="absolute inset-0 rounded-2xl"
        animate={{
          boxShadow: isDark 
            ? ['0 0 60px rgba(14, 165, 233, 0.1)', '0 0 80px rgba(14, 165, 233, 0.15)', '0 0 60px rgba(14, 165, 233, 0.1)']
            : ['0 0 60px rgba(14, 165, 233, 0.08)', '0 0 80px rgba(14, 165, 233, 0.12)', '0 0 60px rgba(14, 165, 233, 0.08)'],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transform: 'scale(1.05)' }}
      />
      
      {/* Floating particles and icons */}
      <FloatingParticles isDark={isDark} />
      <FloatingIcons isDark={isDark} />
      
      <div className={`relative rounded-2xl border shadow-2xl shadow-black/10 overflow-hidden transition-colors ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-stone-200'}`}>
        <WaveAnimation isDark={isDark} />
        
        <div className={`px-5 py-4 border-b rounded-t-2xl relative z-10 transition-colors ${isDark ? 'bg-zinc-800/50 border-zinc-700' : 'bg-gradient-to-r from-stone-50 to-white border-stone-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20 ${
              isDark ? 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/30' : 'bg-sky-50 text-sky-600 ring-1 ring-sky-200'
            }`}>
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className={`text-sm font-semibold ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>Avora AI</p>
              <p className="text-xs text-emerald-500 flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Sẵn sàng hỗ trợ
              </p>
            </div>
          </div>
        </div>

        <div ref={chatRef} className={`p-5 overflow-y-auto relative z-10 transition-colors flex flex-col ${isDark ? 'bg-zinc-900' : 'bg-white'}`} style={{ height: '320px' }}>
          <div className="space-y-4 flex flex-col justify-end">
            <ChatMessage role="ai" content="Chào bạn, mình là Avora. Bạn muốn tìm việc, học kỹ năng mới, hay luyện phỏng vấn trước?" delay={0} isDark={isDark} />
            {messageIndex >= 1 && <ChatMessage role="user" content="Mình muốn học frontend và cần công việc linh hoạt." delay={0} isDark={isDark} />}
            {messageIndex >= 2 && <ChatMessage role="ai" content="Mình sẽ gợi ý lộ trình React cơ bản, bài tập nhỏ để làm portfolio, và các vị trí remote phù hợp." delay={0} isDark={isDark} />}
            {messageIndex >= 3 && <ChatMessage role="user" content="Mình nên bắt đầu từ bước nào?" delay={0} isDark={isDark} />}
            {showTyping && messageIndex >= 3 && <TypingIndicator isDark={isDark} />}
          </div>
        </div>

        <div className={`px-5 py-4 border-t rounded-b-2xl relative z-10 transition-colors ${isDark ? 'bg-zinc-800/50 border-zinc-700' : 'bg-stone-50 border-stone-100'}`}>
          <Link to="/login">
            <Button variant="outline" className={`w-full justify-center gap-2 ${isDark ? 'border-sky-500 text-sky-400 hover:bg-zinc-700' : 'border-sky-500 text-sky-600 hover:bg-sky-50'}`}>
              <Sparkles className="w-4 h-4" />
              Đăng nhập để trò chuyện với Avora
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

// ============ END HERO CHAT SIMULATION ============

const PartnerLogo = ({ name, isDark }: { name: string; isDark: boolean }) => {
  const partner = partners.find(p => p.name === name);
  return (
    <div className={`w-12 h-12 mx-auto mb-2 flex items-center justify-center`}>
      {partner?.logo ? (
        <img src={partner.logo} alt={name} className="w-full h-full object-contain" />
      ) : (
        <span className="text-lg font-bold text-stone-500">{name.charAt(0)}</span>
      )}
    </div>
  );
};

const navItems = [
  { label: 'Documentation', href: '/docs' },
  { label: 'Github', href: 'https://github.com', external: true },
];

const impactStats = [
  { value: '24/7', label: 'Hỏi đáp nghề nghiệp', icon: MessageCircle, color: '#0ea5e9' },
  { value: '4 bước', label: 'Lộ trình rõ ràng', icon: Target, color: '#f59e0b' },
  { value: '100%', label: 'Tập trung tiếp cận', icon: Shield, color: '#10b981' },
  { value: 'AI', label: 'Gợi ý cá nhân hóa', icon: Sparkles, color: '#8b5cf6' },
];

const journeySteps = [
  { step: 1, title: 'Discover Your Strengths', desc: 'Chat with our AI to understand your strengths, skills, and what matters most to you in a career.', icon: Sparkles },
  { step: 2, title: 'Explore Accessible Careers', desc: 'Browse careers matched to your abilities with detailed accessibility insights for each role.', icon: Globe },
  { step: 3, title: 'Prepare with Confidence', desc: 'Build skills with personalized roadmaps and practice interviews until you feel ready.', icon: GraduationCap },
  { step: 4, title: 'Apply & Succeed', desc: 'Get matched with inclusive employers and track your applications with confidence.', icon: TrendingUp },
];

const values = [
  { icon: Sparkles, title: 'AI-Powered Guidance', desc: 'Our intelligent system adapts to your pace and learning style, providing personalized recommendations.', color: '#0ea5e9' },
  { icon: Shield, title: 'Privacy by Design', desc: 'Your data is encrypted and protected. We follow GDPR, CCPA, and international data protection standards.', color: '#10b981' },
  { icon: MessageCircle, title: '24/7 Support', desc: 'Access help whenever you need it. Our support team understands accessibility needs.', color: '#f59e0b' },
  { icon: Heart, title: 'Continuous Learning', desc: 'Track your progress with clear milestones. Celebrate every achievement on your journey.', color: '#ec4899' },
];

const keyFeatures = [
  { 
    icon: Brain, 
    title: 'AI-Powered Matching', 
    desc: 'Intelligent algorithms match your unique skills and preferences with the perfect career opportunities.',
    color: '#0ea5e9'
  },
  { 
    icon: FileText, 
    title: 'Smart Resume Parser', 
    desc: 'Automatically extract and analyze candidate information from resumes for comprehensive profiles.',
    color: '#10b981'
  },
  { 
    icon: Target, 
    title: 'Skill Gap Analyzer', 
    desc: 'Identify gaps between your current skills and target roles, with personalized learning paths.',
    color: '#f59e0b'
  },
  { 
    icon: Bell, 
    title: 'Real-time Notifications', 
    desc: 'Stay updated with instant alerts for new opportunities that match your profile.',
    color: '#8b5cf6'
  },
];

const partners = [
  { name: 'Google', logo: IMAGES.google },
  { name: 'Microsoft Azure', logo: IMAGES.azure },
  { name: 'Supabase', logo: IMAGES.supabase },
  { name: 'Vercel', logo: IMAGES.vercel },
  { name: 'UNICEF', logo: IMAGES.unicef },
  { name: 'WHO', logo: IMAGES.who },
  { name: 'Gia Dinh University', logo: IMAGES.giaDinhUniversity },
];

const testimonials = [
  {
    quote: 'Avora is more than just technology; it is a solution for socio-economic integration. This platform enables businesses to see the true talent of people with disabilities, rather than focusing on their impairments. It is a vital step toward a truly inclusive labor market',
    author: 'Dr. Nguyen Van Mui',
    role: 'Dean of Faculty of IT, Gia Dinh University, CEO of IMESPRO',
    image: IMAGES.people.drNguyenVanMui,
    gradient: 'from-sky-500 to-sky-600'
  },
  {
    quote: 'Our AI technology is specifically designed to identify and eliminate unconscious bias in the recruitment process for candidates with disabilities. We are committed to creating a level playing field where every ability is valued and connected to the right opportunity.',
    author: 'Dr. Nguyen Dang Tri',
    role: 'Vice Dean of Faculty of IT, Gia Dinh University',
    image: IMAGES.people.drNguyenDangTri,
    gradient: 'from-emerald-500 to-emerald-600'
  },
  {
    quote: 'Access to employment is a fundamental right and a core component of overall health. Avora is pioneering the use of technology to realize this right for people with disabilities in Viet Nam, aligning perfectly with international standards for inclusion.',
    author: 'Dr. Angela Pratt',
    role: 'WHO Representative to Viet Nam',
    image: IMAGES.people.drAngelaPratt,
    gradient: 'from-violet-500 to-violet-600'
  },
  {
    quote: 'The greatest challenge in building Avora was ensuring full compatibility with assistive technologies like screen readers and voice commands. We have meticulously optimized every line of code to ensure a seamless, barrier-free digital experience for all users.',
    author: 'Ho Minh Duy',
    role: 'Founder of Avora',
    image: IMAGES.people.hoMinhDuy,
    gradient: 'from-amber-500 to-amber-600'
  },
  {
    quote: 'At the Faculty Assistant of IT, we strive to support students of all abilities. Avora is a powerful tool that helps students with disabilities overcome self-doubt and confidently prove their technical expertise to employers. It has brought life-changing opportunities to our students.',
    author: 'Nguyen Thanh Nam',
    role: 'Faculty Assistant of IT, Gia Dinh University',
    image: IMAGES.people.nguyenThanhNam,
    gradient: 'from-rose-500 to-rose-600'
  },
  {
    quote: 'We highly value how Avora focuses on skill development and confidence-building for youth with disabilities. This is not just about finding a job; it is about empowering the next generation to dictate their own futures and participate actively in society',
    author: 'Silvia Danailov',
    role: 'UNICEF Representative in Viet Nam',
    image: IMAGES.people.silviaDanailov,
    gradient: 'from-cyan-500 to-cyan-600'
  },
];

export default function HomePage() {
  const [theme, setTheme] = useState<Theme>('dark');
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen overflow-x-hidden transition-colors duration-200 ${isDark ? 'bg-zinc-950' : 'bg-stone-50'}`}>
      {/* Grain texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015] z-[9999]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} aria-hidden="true" />

      {/* Skip Links */}
      <nav aria-label="Skip navigation">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-sky-600 focus:text-white focus:rounded-xl focus:font-semibold focus:shadow-lg">Skip to main content</a>
        <a href="#key-features" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-48 focus:z-[100] focus:px-6 focus:py-3 focus:bg-sky-600 focus:text-white focus:rounded-xl focus:font-semibold focus:shadow-lg">Skip to key features</a>
      </nav>

      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-200 ${isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white/90 border-stone-200/50'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <span className={`font-bold text-2xl transition-colors ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>Avora</span>
            </Link>

            {/* Center Navigation Menu */}
            <nav className="hidden lg:flex items-center gap-1 absolute left-1/2 transform -translate-x-1/2">
              <Link to="/docs" className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${isDark ? 'text-zinc-300 hover:text-sky-400 hover:bg-zinc-800' : 'text-stone-600 hover:text-sky-600 hover:bg-stone-100'}`}>
                Tài liệu
              </Link>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors rounded-lg ${isDark ? 'text-zinc-300 hover:text-sky-400 hover:bg-zinc-800' : 'text-stone-600 hover:text-sky-600 hover:bg-stone-100'}`}>
                GitHub
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>
            </nav>

            {/* Right side - Theme toggle + Login/Signup */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'text-zinc-400 hover:text-sky-400 hover:bg-zinc-800' : 'text-stone-500 hover:text-sky-600 hover:bg-stone-100'}`}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <Link to="/login">
                <Button size="sm" className="bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20 hover:shadow-xl hover:shadow-sky-500/30">
                  Đăng nhập
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <motion.section className={`relative pt-12 pb-20 lg:pt-16 lg:pb-28 overflow-hidden transition-colors duration-200 ${isDark ? 'bg-zinc-950' : 'bg-stone-50'}`}>
        {/* Animated gradient background */}
        <AnimatedGradient isDark={isDark} />
        
        {/* Floating light blobs */}
        <FloatingLightBlobs isDark={isDark} />
        
        {/* Legacy blur orbs - kept for subtle depth */}
        <div className={`absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl pointer-events-none ${isDark ? 'bg-sky-500/[0.03]' : 'bg-sky-500/[0.02]'}`} aria-hidden="true" />
        <div className={`absolute bottom-10 right-10 w-96 h-96 rounded-full blur-3xl pointer-events-none ${isDark ? 'bg-sky-400/[0.02]' : 'bg-sky-600/[0.02]'}`} aria-hidden="true" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Hero Content */}
            <motion.div {...fadeUp}>
              <motion.h1 className={`text-4xl sm:text-5xl lg:text-[3.5rem] font-display font-semibold leading-[1.05] tracking-tight mb-6 transition-colors ${isDark ? 'text-zinc-100' : 'text-stone-900'}`} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}>
                Trợ lý AI đồng hành
                <br />
                <span className={isDark ? 'text-sky-400' : 'text-sky-600'}>cùng người khuyết tật</span>
              </motion.h1>

              <motion.p className={`text-lg lg:text-xl leading-relaxed max-w-lg mb-8 transition-colors ${isDark ? 'text-zinc-400' : 'text-stone-600'}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
                Avora giúp bạn khám phá điểm mạnh, xây lộ trình học, luyện phỏng vấn và tìm môi trường làm việc phù hợp với nhu cầu tiếp cận của mình.
              </motion.p>

              <motion.div className="flex flex-col sm:flex-row gap-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}>
                <Link to="/login">
                  <Button size="lg" className="bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20 hover:shadow-xl hover:shadow-sky-500/30 transition-all duration-300 w-full sm:w-auto">
                    Bắt đầu miễn phí
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className={`border-2 transition-all duration-200 w-full sm:w-auto ${isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600' : 'border-stone-200 text-stone-600 hover:bg-stone-100 hover:border-stone-300'}`} onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
                  Xem cách hoạt động
                </Button>
              </motion.div>

              {/* Impact Stats */}
              <motion.div {...stagger} className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.7 }}>
                {impactStats.map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.8 + i * 0.1 }} className="text-center lg:text-left">
                      <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                        <Icon className="w-4 h-4" style={{ color: stat.color }} />
                        <span className={`text-xl lg:text-2xl font-bold ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>{stat.value}</span>
                      </div>
                      <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-stone-500'}`}>{stat.label}</p>
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>

            {/* Right: AI Chat */}
            <div className="hidden lg:block">
              <ChatInterface isDark={isDark} />
            </div>
          </div>

          {/* Mobile: AI Chat Preview */}
          <motion.div className="lg:hidden mt-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
            <div className={`rounded-2xl border shadow-xl p-4 ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-stone-200'}`}>
              <div className={`flex items-center gap-3 mb-4 pb-4 border-b ${isDark ? 'border-zinc-700' : 'border-stone-100'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/30' : 'bg-sky-50 text-sky-600 ring-1 ring-sky-200'
                }`}>
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>Avora AI</p>
                  <p className="text-xs text-emerald-500">Sẵn sàng hỗ trợ</p>
                </div>
              </div>
              <p className={`text-sm text-center ${isDark ? 'text-zinc-400' : 'text-stone-600'}`}>Trò chuyện với AI để tìm hướng học và việc làm phù hợp.</p>
              <Link to="/login">
                <Button className="w-full mt-4 bg-sky-500 hover:bg-sky-600">
                  Dùng thử AI Chat
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Main Content */}
      <main id="main-content" role="main">
        {/* Key Features Section */}
        <section id="key-features" className={`py-16 lg:py-24 transition-colors`} aria-labelledby="features-heading">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-12">
              <span className={`inline-flex items-center gap-2 text-sm font-semibold tracking-wider uppercase mb-4 ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                <Sparkles className="w-4 h-4" />
                Key Features
              </span>
              <h2 id="features-heading" className={`text-3xl lg:text-4xl font-display font-medium leading-tight mb-4 ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>
                Powerful tools for your career journey
              </h2>
              <p className={`text-lg ${isDark ? 'text-zinc-400' : 'text-stone-600'}`}>
                Everything you need to find, prepare for, and land your dream job.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {keyFeatures.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <motion.article
                    key={feature.title}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    whileHover={{ y: -4 }}
                    className={`group relative p-6 rounded-2xl border transition-all duration-300 ${
                      isDark 
                        ? 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800' 
                        : 'bg-white border-stone-200 hover:border-stone-300 hover:shadow-lg'
                    }`}
                  >
                    {/* Icon */}
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: `${feature.color}15` }}
                    >
                      <Icon className="w-7 h-7" style={{ color: feature.color }} aria-hidden="true" />
                    </div>
                    
                    {/* Content */}
                    <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>
                      {feature.title}
                    </h3>
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-zinc-400' : 'text-stone-600'}`}>
                      {feature.desc}
                    </p>

                    {/* Subtle hover glow */}
                    <div 
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{ 
                        boxShadow: `inset 0 0 30px ${feature.color}08` 
                      }}
                    />
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className={`py-16 lg:py-24 transition-colors`} aria-labelledby="process-heading">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left - Roadmap Content */}
              <motion.div {...fadeUp}>
                <span className={`inline-flex items-center gap-2 text-sm font-semibold tracking-wider uppercase mb-4 ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                  <Zap className="w-4 h-4" />
                  Simple Process
                </span>
                <h2 id="process-heading" className={`text-3xl lg:text-4xl font-display font-medium leading-tight mb-4 ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>
                  Four steps to your next career
                </h2>
                <p className={`text-lg mb-8 ${isDark ? 'text-zinc-400' : 'text-stone-600'}`}>A clear path designed to respect your time and abilities.</p>

                {/* Roadmap */}
                <div className="relative">
                  {/* Vertical line */}
                  <div className={`absolute left-[22px] top-3 bottom-3 w-0.5 ${isDark ? 'bg-zinc-700' : 'bg-stone-200'}`} />

                  <div className="space-y-4">
                    {journeySteps.map((item, index) => {
                      const Icon = item.icon;
                      const isLast = index === journeySteps.length - 1;
                      return (
                        <motion.div 
                          key={item.step} 
                          initial={{ opacity: 0, x: -30 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: index * 0.15 }}
                          whileHover={{ x: 8 }}
                          className="relative flex gap-5 cursor-pointer group"
                        >
                          {/* Step number circle */}
                          <div className={`relative z-10 w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                            isLast 
                              ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30 scale-110' 
                              : isDark 
                                ? 'bg-zinc-800 text-sky-400 border-2 border-sky-500 group-hover:bg-sky-500/20 group-hover:scale-105' 
                                : 'bg-white text-sky-600 border-2 border-sky-500 shadow-md group-hover:bg-sky-50 group-hover:scale-105'
                          }`}>
                            <Icon className={`w-5 h-5 transition-transform duration-300 ${!isLast ? 'group-hover:scale-110' : ''}`} />
                          </div>
                          
                          {/* Content */}
                          <div className={`pt-1.5 pb-5 transition-colors ${!isLast ? `border-b ${isDark ? 'border-zinc-800' : 'border-stone-100'}` : ''}`}>
                            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                              Step {item.step}
                            </span>
                            <h3 className={`text-base font-semibold mt-0.5 mb-1.5 transition-colors ${isDark ? 'text-zinc-100 group-hover:text-sky-400' : 'text-stone-900 group-hover:text-sky-600'}`}>{item.title}</h3>
                            <p className={`text-sm leading-relaxed ${isDark ? 'text-zinc-400' : 'text-stone-600'}`}>{item.desc}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>

              {/* Right - GIF */}
              <motion.div {...fadeUp} className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-sky-500/10 aspect-square">
<img
                    src={IMAGES.fourStep}
                    alt="Four steps to your next career"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                </div>
                {/* Decorative elements */}
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl" />
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-sky-400/5 rounded-full blur-2xl" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Partners */}
        {/* Partners - Marquee Section */}
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .marquee-wrapper {
            overflow: hidden;
          }
          .marquee-content {
            display: flex;
            gap: 2rem;
            animation: marquee 50s linear infinite;
            will-change: transform;
          }
          .marquee-content:hover {
            animation-play-state: paused;
          }
        `}</style>
        <section id="partners" className={`py-16 lg:py-20 overflow-hidden transition-colors ${isDark ? 'bg-zinc-900' : 'bg-stone-100'}`} aria-labelledby="partners-heading">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-12">
            <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto">
              <span className={`inline-flex items-center gap-2 text-sm font-semibold tracking-wider uppercase mb-4 ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                <Star className="w-4 h-4" />
                Trusted By Industry Leaders
              </span>
              <h2 id="partners-heading" className={`text-3xl lg:text-4xl font-display font-medium leading-tight mb-4 ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>Our Partners</h2>
              <p className={`text-lg ${isDark ? 'text-zinc-400' : 'text-stone-600'}`}>Leading organizations committed to disability inclusion and accessible workplaces.</p>
            </motion.div>
          </div>

          {/* Marquee Container - Constrained */}
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="relative">
              {/* Gradient Masks */}
              <div className={`absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none ${isDark ? 'bg-gradient-to-r from-zinc-900 to-transparent' : 'bg-gradient-to-r from-stone-100 to-transparent'}`} />
              <div className={`absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none ${isDark ? 'bg-gradient-to-l from-zinc-900 to-transparent' : 'bg-gradient-to-l from-stone-100 to-transparent'}`} />
              
              {/* Single Row - Infinite Loop */}
              <div className="marquee-wrapper">
                <div className="marquee-content">
                  {[...partners, ...partners].map((partner, i) => (
                    <div
                      key={`partner-${i}`}
                      className="flex-shrink-0 flex items-center justify-center px-5 py-5 rounded-2xl border border-stone-200/80 transition-all duration-300 hover:scale-105 bg-white shadow-sm"
                      style={{ minWidth: '140px', minHeight: '140px' }}
                    >
                      <img 
                        src={partner.logo} 
                        alt={partner.name} 
                        className="w-24 h-24 object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }} className="mt-12 text-center">
            <p className={`mb-4 ${isDark ? 'text-zinc-500' : 'text-stone-500'}`}>Want to partner with us?</p>
            <Link to="/partners">
              <Button variant="outline" className={`border-sky-500 transition-colors ${isDark ? 'text-sky-400 hover:bg-zinc-700 hover:border-sky-400' : 'text-sky-600 hover:bg-sky-50 hover:border-sky-600'}`}>
                Become a Partner
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </section>

        {/* Values */}
        <section className="py-16 lg:py-24 transition-colors" aria-labelledby="values-heading">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left - Video/GIF */}
              <motion.div {...fadeUp} className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-sky-500/10">
<img
                    src={IMAGES.handshakes}
                    alt="People collaborating and building trust"
                    className="w-full h-auto object-cover"
                  />
                  {/* Subtle overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                </div>
                {/* Decorative accent */}
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl" />
                <div className="absolute -top-4 -left-4 w-32 h-32 bg-sky-400/5 rounded-full blur-3xl" />
              </motion.div>

              {/* Right - Content */}
              <div>
                <motion.div {...fadeUp} className="mb-8">
                  <span className={`inline-flex items-center gap-2 text-sm font-semibold tracking-wider uppercase mb-4 ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                    <Heart className="w-4 h-4" />
                    Why Choose Us
                  </span>
                  <h2 id="values-heading" className={`text-3xl lg:text-4xl font-display font-medium leading-tight mb-4 ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>Why people trust us</h2>
                  <p className={`text-lg ${isDark ? 'text-zinc-400' : 'text-stone-600'}`}>We believe everyone deserves a fulfilling career. Our platform is designed with that belief at its core.</p>
                </motion.div>

                <div className="grid sm:grid-cols-2 gap-6">
                  {values.map((value, i) => {
                    const Icon = value.icon;
                    return (
                      <motion.article 
                        key={value.title} 
                        initial={{ opacity: 0, y: 24 }} 
                        whileInView={{ opacity: 1, y: 0 }} 
                        viewport={{ once: true, margin: '-50px' }} 
                        transition={{ duration: 0.6, delay: i * 0.1 }} 
                        className="group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: `${value.color}15` }}>
                            <Icon className="w-6 h-6" style={{ color: value.color }} aria-hidden="true" />
                          </div>
                          <div>
                            <h3 className={`text-base font-semibold mb-1 ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>{value.title}</h3>
                            <p className={`text-sm leading-relaxed ${isDark ? 'text-zinc-400' : 'text-stone-600'}`}>{value.desc}</p>
                          </div>
                        </div>
                      
                      </motion.article>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className={`py-16 lg:py-24 transition-colors ${isDark ? 'bg-zinc-900' : 'bg-stone-100'}`} aria-labelledby="testimonials-heading">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-12">
              <span className={`inline-flex items-center gap-2 text-sm font-semibold tracking-wider uppercase mb-4 ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                <Star className="w-4 h-4" />
                Success Stories
              </span>
              <h2 id="testimonials-heading" className={`text-3xl lg:text-4xl font-display font-medium leading-tight mb-4 text-center ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>What our users say</h2>
              <p className={`text-lg text-center ${isDark ? 'text-zinc-400' : 'text-stone-600'}`}>Real stories from people who found their dream careers through Avora.</p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((testimonial, i) => (
                <motion.article 
                  key={i} 
                  initial={{ opacity: 0, y: 24 }} 
                  whileInView={{ opacity: 1, y: 0 }} 
                  viewport={{ once: true }} 
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  whileHover={{ y: -4 }}
                  className={`group relative p-6 lg:p-8 rounded-2xl border transition-all duration-300 ${
                    isDark 
                      ? 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600' 
                      : 'bg-white border-stone-200 hover:border-stone-300 hover:shadow-xl'
                  }`}
                >
                  {/* Author Info - Top */}
                  <div className="flex items-center gap-4 mb-5">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-lg ring-2 ring-sky-500/30">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.author}
                        className="w-full h-full object-cover"
                        style={
                          testimonial.author === 'Silvia Danailov' 
                            ? { objectPosition: '95% center', transform: 'scale(1.95)' } 
                            : testimonial.author === 'Ho Minh Duy'
                            ? { objectPosition: 'center 15%', transform: 'scale(1.43)' }
                            : testimonial.author === 'Nguyen Thanh Nam'
                            ? { objectPosition: 'center 15%', transform: 'scale(1.33)' }
                            : testimonial.author === 'Dr. Nguyen Van Mui'
                            ? { objectPosition: 'center 15%', transform: 'scale(1.33)' }
                            : testimonial.author === 'Dr. Nguyen Dang Tri'
                            ? { objectPosition: 'center 15%', transform: 'scale(1.03)' }
                            : testimonial.author === 'Dr. Angela Pratt'
                            ? { objectPosition: 'center 5%', transform: 'scale(1.13)' }
                            : { objectPosition: 'center 20%' }
                        }
                      />
                    </div>
                    {/* Name & Role */}
                    <div>
                      <p className={`font-bold ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>{testimonial.author}</p>
                      <p className={`text-sm font-medium ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>{testimonial.role}</p>
                    </div>
                  </div>
                  
                  {/* Quote Text */}
                  <blockquote className={`text-base lg:text-lg leading-relaxed italic text-left ${isDark ? 'text-zinc-300' : 'text-stone-700'}`}>
                    {testimonial.quote}
                  </blockquote>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-24 bg-gradient-to-br from-sky-500 to-sky-600" aria-labelledby="cta-heading">
          <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
            <motion.div {...fadeUp} className="max-w-2xl mx-auto">
              <h2 id="cta-heading" className="text-3xl lg:text-4xl font-display font-medium leading-tight text-white mb-4">
                Ready to take the first step?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-xl mx-auto">
                Join thousands of people with disabilities who are building careers they love. It starts with a conversation.
              </p>
              <Link to="/login">
                <Button size="lg" className="bg-white text-sky-600 hover:bg-sky-50 shadow-xl hover:shadow-2xl transition-all duration-300 text-lg px-8">
                  Get started free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={`py-12 transition-colors ${isDark ? 'bg-zinc-900 text-zinc-400' : 'bg-stone-900 text-stone-400'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-8">
            <div className="lg:col-span-1">
              <Link to="/" className="flex items-center gap-3 mb-4">
                <span className="font-bold text-2xl text-white">Avora</span>
              </Link>
              <p className={`text-sm leading-relaxed mb-4 ${isDark ? 'text-zinc-400' : 'text-stone-400'}`}>
                Empowering people with disabilities to achieve their career goals through AI-powered guidance and personalized support.
              </p>
            </div>
            
            <nav aria-label="Platform">
              <h3 className={`font-semibold mb-4 text-sm ${isDark ? 'text-zinc-200' : 'text-stone-200'}`}>Platform</h3>
              <ul className="space-y-3 text-sm">
                <li><Link to="/assessment" className="hover:text-white transition-colors">Assessment</Link></li>
                <li><Link to="/jobs" className="hover:text-white transition-colors">Find Jobs</Link></li>
                <li><Link to="/roadmaps" className="hover:text-white transition-colors">Roadmaps</Link></li>
                <li><Link to="/interviews" className="hover:text-white transition-colors">Practice</Link></li>
              </ul>
            </nav>
            
            <nav aria-label="Support">
              <h3 className={`font-semibold mb-4 text-sm ${isDark ? 'text-zinc-200' : 'text-stone-200'}`}>Support</h3>
              <ul className="space-y-3 text-sm">
                <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </nav>
            
            <nav aria-label="Connect">
              <h3 className={`font-semibold mb-4 text-sm ${isDark ? 'text-zinc-200' : 'text-stone-200'}`}>Connect</h3>
              <ul className="space-y-3 text-sm">
                <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">Github <ExternalLink className="w-3 h-3" /></a></li>
                <li><a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">LinkedIn</a></li>
                <li><a href="mailto:support@avora.com" className="hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </nav>
          </div>
          
          <div className={`pt-6 border-t text-sm text-center ${isDark ? 'border-zinc-800' : 'border-stone-800'}`}>
            <p>&copy; {new Date().getFullYear()} Avora. Built with care for everyone.</p>
          </div>
        </div>
      </footer>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </div>
  );
}
