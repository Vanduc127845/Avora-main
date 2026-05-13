import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Building2, Users, Globe, Heart, 
  CheckCircle, Send, Loader2, Sparkles, Award, Target
} from 'lucide-react';
import { Button } from '../../../components/ui';

interface FormData {
  organizationName: string;
  contactPerson: string;
  email: string;
  phone: string;
  website: string;
  companySize: string;
  partnershipType: string;
  message: string;
}

const fadeUp = {
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

// Floating particle component
const FloatingParticle = ({ delay, x, y, size }: { delay: number; x: number; y: number; size: number }) => (
  <motion.div
    className="absolute rounded-full bg-sky-500/20"
    style={{
      left: `${x}%`,
      top: `${y}%`,
      width: size,
      height: size,
    }}
    animate={{
      y: [0, -30, 0],
      opacity: [0.2, 0.5, 0.2],
      scale: [1, 1.2, 1],
    }}
    transition={{
      duration: 4 + Math.random() * 2,
      delay,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  />
);

// Glowing orb background
const GlowOrb = ({ className, style }: { className: string; style?: React.CSSProperties }) => (
  <div className={`absolute rounded-full blur-3xl opacity-30 ${className}`} style={style} />
);

const PartnersPage = () => {
  const [isDark, setIsDark] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    organizationName: '',
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    companySize: '',
    partnershipType: '',
    message: '',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const partnershipTypes = [
    { 
      id: 'employer', 
      label: 'Inclusive Employer', 
      icon: Building2, 
      description: 'Offer jobs and internships to our community',
      stats: '200+ companies',
    },
    { 
      id: 'ngo', 
      label: 'NGO Partner', 
      icon: Heart, 
      description: 'Collaborate on advocacy and programs',
      stats: '50+ organizations',
    },
    { 
      id: 'education', 
      label: 'Educational Institution', 
      icon: Users, 
      description: 'Provide training and certifications',
      stats: '30+ universities',
    },
    { 
      id: 'technology', 
      label: 'Technology Partner', 
      icon: Globe, 
      description: 'Co-develop accessible solutions',
      stats: '15+ partners',
    },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/partner-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        alert('Failed to submit. Please try again.');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-700 ${
      isDark ? 'bg-zinc-950' : 'bg-stone-50'
    }`}>
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <GlowOrb className="w-96 h-96 bg-sky-500/30 -top-48 -left-48 animate-pulse" />
        <GlowOrb className="w-80 h-80 bg-violet-500/20 top-1/3 -right-40 animate-pulse" style={{ animationDelay: '1s' }} />
        <GlowOrb className="w-64 h-64 bg-cyan-500/20 bottom-20 left-1/4 animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Floating Particles */}
        {mounted && [...Array(12)].map((_, i) => (
          <FloatingParticle
            key={i}
            delay={i * 0.3}
            x={10 + Math.random() * 80}
            y={10 + Math.random() * 80}
            size={4 + Math.random() * 8}
          />
        ))}
      </div>

      {/* Grid Pattern Overlay */}
      <div className={`fixed inset-0 opacity-[0.02] ${
        isDark ? 'bg-[linear-gradient(rgba(255,255,255,.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.1)_1px,transparent_1px)]' : 'bg-[linear-gradient(rgba(0,0,0,.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.1)_1px,transparent_1px)]'
      }`} style={{ backgroundSize: '40px 40px' }} />

      {/* Header */}
      <header className={`relative border-b backdrop-blur-xl transition-colors duration-500 ${
        isDark ? 'bg-zinc-950/80 border-zinc-800/50' : 'bg-white/80 border-stone-200/50'
      }`}>
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link 
            to="/" 
            className={`inline-flex items-center gap-2 text-sm font-medium transition-all duration-300 hover:gap-3 ${
              isDark ? 'text-zinc-400 hover:text-sky-400' : 'text-stone-500 hover:text-sky-600'
            }`}
          >
            <motion.span
              whileHover={{ x: -4 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <ArrowLeft className="w-4 h-4" />
            </motion.span>
            Back to Home
          </Link>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-6 py-12 lg:py-20">
        {/* Hero Section */}
        <motion.div 
          {...fadeUp}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium mb-8 border ${
              isDark 
                ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' 
                : 'bg-sky-50 text-sky-600 border-sky-200'
            }`}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-4 h-4" />
            </motion.div>
            Join Our Mission
          </motion.div>

          <motion.h1 
            className={`text-5xl lg:text-7xl font-bold mb-6 leading-[1.1] ${
              isDark ? 'text-zinc-100' : 'text-stone-900'
            }`}
          >
            Become a{' '}
            <span className={`relative ${
              isDark ? 'text-sky-400' : 'text-sky-600'
            }`}>
              <motion.span
                className="relative z-10"
                initial={{ backgroundSize: '0% 100%' }}
                animate={{ backgroundSize: '100% 100%' }}
                transition={{ duration: 1, delay: 0.5 }}
              >
                Partner
              </motion.span>
              <motion.span
                className={`absolute -bottom-2 left-0 h-3 rounded-full ${
                  isDark ? 'bg-sky-500/30' : 'bg-sky-400/30'
                }`}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.8, delay: 0.8 }}
              />
            </span>
          </motion.h1>

          <motion.p 
            className={`text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed ${
              isDark ? 'text-zinc-400' : 'text-stone-600'
            }`}
          >
            Together, we can create more inclusive workplaces and career opportunities 
            for people with disabilities. Join us in making a difference.
          </motion.p>

          {/* Stats Row */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center gap-8 mt-12"
          >
            {[
              { icon: Award, value: '295+', label: 'Partners' },
              { icon: Target, value: '50K+', label: 'Careers Matched' },
              { icon: Users, value: '10K+', label: 'Lives Impacted' },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                  className="text-center"
                >
                  <div className={`flex items-center justify-center gap-2 mb-1 ${
                    isDark ? 'text-sky-400' : 'text-sky-600'
                  }`}>
                    <Icon className="w-5 h-5" />
                    <span className="text-2xl lg:text-3xl font-bold">{stat.value}</span>
                  </div>
                  <span className={`text-sm ${isDark ? 'text-zinc-500' : 'text-stone-500'}`}>
                    {stat.label}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>

        {/* Partnership Types */}
        <motion.div 
          {...stagger}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-20"
        >
          {partnershipTypes.map((type, i) => {
            const Icon = type.icon;
            return (
              <motion.article
                key={type.id}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className={`group relative p-7 rounded-2xl border overflow-hidden transition-all duration-500 ${
                  isDark 
                    ? 'bg-zinc-900/60 border-zinc-800/80 hover:border-sky-500/50 hover:bg-zinc-900/90' 
                    : 'bg-white/80 border-stone-200 hover:border-sky-400/60 hover:shadow-xl hover:shadow-sky-500/10'
                }`}
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                  isDark 
                    ? 'bg-gradient-to-br from-sky-500/5 to-transparent' 
                    : 'bg-gradient-to-br from-sky-400/5 to-transparent'
                }`} />
                
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 relative ${
                    isDark ? 'bg-sky-500/10' : 'bg-sky-50'
                  }`}
                >
                  <Icon className={`w-7 h-7 ${
                    isDark ? 'text-sky-400' : 'text-sky-600'
                  }`} />
                </motion.div>

                <h3 className={`font-semibold text-lg mb-2 relative ${
                  isDark ? 'text-zinc-100' : 'text-stone-900'
                }`}>
                  {type.label}
                </h3>
                
                <p className={`text-sm mb-4 relative ${
                  isDark ? 'text-zinc-500' : 'text-stone-500'
                }`}>
                  {type.description}
                </p>

                <div className={`text-xs font-medium px-3 py-1 rounded-full inline-block relative ${
                  isDark ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-50 text-sky-600'
                }`}>
                  {type.stats}
                </div>
              </motion.article>
            );
          })}
        </motion.div>

        {/* Form Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className={`max-w-3xl mx-auto rounded-3xl p-8 lg:p-12 relative overflow-hidden ${
            isDark 
              ? 'bg-zinc-900/60 border border-zinc-800/60 backdrop-blur-xl' 
              : 'bg-white/80 border border-stone-200/60 backdrop-blur-xl shadow-2xl shadow-stone-200/30'
          }`}
        >
          {/* Decorative corner glow */}
          <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl ${
            isDark ? 'bg-sky-500/10' : 'bg-sky-400/10'
          }`} />
          <div className={`absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl ${
            isDark ? 'bg-violet-500/10' : 'bg-violet-400/10'
          }`} />

          <AnimatePresence mode="wait">
            {isSubmitted ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className="text-center py-8 relative"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 ${
                    isDark ? 'bg-sky-500/20' : 'bg-sky-50'
                  }`}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, delay: 0.3 }}
                  >
                    <CheckCircle className={`w-12 h-12 ${
                      isDark ? 'text-sky-400' : 'text-sky-600'
                    }`} />
                  </motion.div>
                </motion.div>
                
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className={`text-3xl font-bold mb-4 ${
                    isDark ? 'text-zinc-100' : 'text-stone-900'
                  }`}
                >
                  Thank you for your interest!
                </motion.h2>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className={`mb-10 ${isDark ? 'text-zinc-400' : 'text-stone-600'}`}
                >
                  We've received your partnership inquiry and will get back to you within 24-48 hours.
                </motion.p>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button onClick={() => window.location.href = '/'}>
                    Return Home
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit} 
                className="space-y-6 relative"
              >
                <div className="grid sm:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-zinc-300' : 'text-stone-700'
                    }`}>
                      Organization Name *
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                      type="text"
                      name="organizationName"
                      required
                      value={formData.organizationName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3.5 rounded-xl border transition-all duration-300 ${
                        isDark 
                          ? 'bg-zinc-800/60 border-zinc-700/60 text-zinc-100 focus:bg-zinc-800 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20' 
                          : 'bg-stone-50/80 border-stone-300/60 text-stone-900 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                      } focus:outline-none`}
                      placeholder="Acme Corporation"
                    />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-zinc-300' : 'text-stone-700'
                    }`}>
                      Contact Person *
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                      type="text"
                      name="contactPerson"
                      required
                      value={formData.contactPerson}
                      onChange={handleChange}
                      className={`w-full px-4 py-3.5 rounded-xl border transition-all duration-300 ${
                        isDark 
                          ? 'bg-zinc-800/60 border-zinc-700/60 text-zinc-100 focus:bg-zinc-800 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20' 
                          : 'bg-stone-50/80 border-stone-300/60 text-stone-900 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                      } focus:outline-none`}
                      placeholder="Sarah Johnson"
                    />
                  </motion.div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-zinc-300' : 'text-stone-700'
                    }`}>
                      Email Address *
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3.5 rounded-xl border transition-all duration-300 ${
                        isDark 
                          ? 'bg-zinc-800/60 border-zinc-700/60 text-zinc-100 focus:bg-zinc-800 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20' 
                          : 'bg-stone-50/80 border-stone-300/60 text-stone-900 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                      } focus:outline-none`}
                      placeholder="sarah@acme.com"
                    />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-zinc-300' : 'text-stone-700'
                    }`}>
                      Phone Number
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full px-4 py-3.5 rounded-xl border transition-all duration-300 ${
                        isDark 
                          ? 'bg-zinc-800/60 border-zinc-700/60 text-zinc-100 focus:bg-zinc-800 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20' 
                          : 'bg-stone-50/80 border-stone-300/60 text-stone-900 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                      } focus:outline-none`}
                      placeholder="+1 (555) 123-4567"
                    />
                  </motion.div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-zinc-300' : 'text-stone-700'
                    }`}>
                      Company Size
                    </label>
                    <motion.select
                      whileFocus={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                      name="companySize"
                      value={formData.companySize}
                      onChange={handleChange}
                      className={`w-full px-4 py-3.5 rounded-xl border transition-all duration-300 ${
                        isDark 
                          ? 'bg-zinc-800/60 border-zinc-700/60 text-zinc-100 focus:bg-zinc-800 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20' 
                          : 'bg-stone-50/80 border-stone-300/60 text-stone-900 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                      } focus:outline-none`}
                    >
                      <option value="">Select size</option>
                      <option value="1-50">1-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-1000">201-1000 employees</option>
                      <option value="1000+">1000+ employees</option>
                    </motion.select>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-zinc-300' : 'text-stone-700'
                    }`}>
                      Partnership Type *
                    </label>
                    <motion.select
                      whileFocus={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                      name="partnershipType"
                      required
                      value={formData.partnershipType}
                      onChange={handleChange}
                      className={`w-full px-4 py-3.5 rounded-xl border transition-all duration-300 ${
                        isDark 
                          ? 'bg-zinc-800/60 border-zinc-700/60 text-zinc-100 focus:bg-zinc-800 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20' 
                          : 'bg-stone-50/80 border-stone-300/60 text-stone-900 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                      } focus:outline-none`}
                    >
                      <option value="">Select type</option>
                      {partnershipTypes.map((type) => (
                        <option key={type.id} value={type.id}>{type.label}</option>
                      ))}
                    </motion.select>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-zinc-300' : 'text-stone-700'
                  }`}>
                    Website URL
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className={`w-full px-4 py-3.5 rounded-xl border transition-all duration-300 ${
                      isDark 
                        ? 'bg-zinc-800/60 border-zinc-700/60 text-zinc-100 focus:bg-zinc-800 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20' 
                        : 'bg-stone-50/80 border-stone-300/60 text-stone-900 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                    } focus:outline-none`}
                    placeholder="https://www.acme.com"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 }}
                >
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-zinc-300' : 'text-stone-700'
                  }`}>
                    Tell us about your partnership goals
                  </label>
                  <motion.textarea
                    whileFocus={{ scale: 1.01, y: 0 }}
                    transition={{ duration: 0.2 }}
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    className={`w-full px-4 py-3.5 rounded-xl border transition-all duration-300 resize-none ${
                      isDark 
                        ? 'bg-zinc-800/60 border-zinc-700/60 text-zinc-100 focus:bg-zinc-800 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20' 
                        : 'bg-stone-50/80 border-stone-300/60 text-stone-900 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                    } focus:outline-none`}
                    placeholder="How would you like to collaborate with us?"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-4 text-base font-semibold shadow-lg shadow-sky-500/20 ${
                      isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center"
                      >
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Submitting...
                      </motion.span>
                    ) : (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center"
                      >
                        Submit Partnership Inquiry
                        <Send className="w-5 h-5 ml-2" />
                      </motion.span>
                    )}
                  </Button>
                </motion.div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Theme Toggle */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsDark(!isDark)}
          className={`fixed bottom-8 right-8 p-4 rounded-2xl shadow-2xl backdrop-blur-xl border transition-all duration-500 ${
            isDark 
              ? 'bg-zinc-900/80 text-zinc-100 border-zinc-700/50 hover:bg-zinc-800/80' 
              : 'bg-white/80 text-stone-900 border-stone-200/50 hover:bg-white'
          }`}
          aria-label="Toggle theme"
        >
          <motion.div
            animate={{ rotate: isDark ? 0 : 180 }}
            transition={{ duration: 0.5 }}
          >
            {isDark ? '☀️' : '🌙'}
          </motion.div>
        </motion.button>
      </main>
    </div>
  );
};

export default PartnersPage;
