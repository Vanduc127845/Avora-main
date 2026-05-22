import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Building2, Users, Globe, Heart, 
  CheckCircle, Send, Loader2, Sparkles, Award, Target,
  AlertCircle, Moon, Sun,
} from 'lucide-react';
import { Button } from '../../../components/ui';
import { handleApiError, post } from '../../../services';

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

const PartnersPage = () => {
  const [isDark, setIsDark] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionNote, setSubmissionNote] = useState<string | null>(null);
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

  const partnershipTypes = [
    { 
      id: 'employer', 
      label: 'Nhà tuyển dụng hòa nhập', 
      icon: Building2, 
      description: 'Đăng cơ hội việc làm, thực tập và mentorship phù hợp',
      stats: 'Tuyển dụng',
    },
    { 
      id: 'ngo', 
      label: 'Đối tác xã hội', 
      icon: Heart, 
      description: 'Đồng hành trong chương trình hỗ trợ người khuyết tật',
      stats: 'Cộng đồng',
    },
    { 
      id: 'education', 
      label: 'Cơ sở đào tạo', 
      icon: Users, 
      description: 'Cung cấp khóa học, chứng chỉ và dự án thực hành',
      stats: 'Đào tạo',
    },
    { 
      id: 'technology', 
      label: 'Đối tác công nghệ', 
      icon: Globe, 
      description: 'Tích hợp công cụ, dữ liệu và giải pháp trợ năng',
      stats: 'Tích hợp',
    },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSubmissionNote(null);
    
    try {
      const result = await post<{ success: boolean; message?: string; delivery?: string }>('/api/partner-inquiry', formData);
      setSubmissionNote(result.delivery === 'dry-run' ? result.message || 'Thông tin đã được ghi nhận ở chế độ demo.' : null);
      setIsSubmitted(true);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || apiError.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-700 ${
      isDark ? 'bg-zinc-950' : 'bg-stone-50'
    }`}>
      <div className={`fixed inset-0 pointer-events-none ${
        isDark ? 'bg-[linear-gradient(180deg,#09090b_0%,#0f172a_45%,#111827_100%)]' : 'bg-[linear-gradient(180deg,#f8fafc_0%,#eef6ff_46%,#f5f5f4_100%)]'
      }`}>
        <div className={`absolute inset-x-0 top-0 h-80 ${isDark ? 'bg-sky-500/10' : 'bg-sky-100/70'}`} />
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
            Về trang chủ
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
            Mở rộng tác động cùng Avora
          </motion.div>

          <motion.h1 
            className={`text-5xl lg:text-7xl font-bold mb-6 leading-[1.1] ${
              isDark ? 'text-zinc-100' : 'text-stone-900'
            }`}
          >
            Trở thành{' '}
            <span className={`relative ${
              isDark ? 'text-sky-400' : 'text-sky-600'
            }`}>
              <motion.span
                className="relative z-10"
                initial={{ backgroundSize: '0% 100%' }}
                animate={{ backgroundSize: '100% 100%' }}
                transition={{ duration: 1, delay: 0.5 }}
              >
                đối tác Avora
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
            Kết nối nhà tuyển dụng, tổ chức xã hội, trường học và đối tác công nghệ để tạo thêm cơ hội nghề nghiệp tiếp cận được cho người khuyết tật.
          </motion.p>

          {/* Stats Row */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center gap-8 mt-12"
          >
            {[
              { icon: Award, value: '4', label: 'Nhóm hợp tác' },
              { icon: Target, value: '24-48h', label: 'Phản hồi' },
              { icon: Users, value: '100%', label: 'Ưu tiên tiếp cận' },
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
          <div className={`absolute inset-x-0 top-0 h-1 ${isDark ? 'bg-sky-400' : 'bg-sky-500'}`} />

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
                  Đã nhận thông tin hợp tác
                </motion.h2>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className={`mb-10 ${isDark ? 'text-zinc-400' : 'text-stone-600'}`}
                >
                  Avora sẽ phản hồi trong 24-48 giờ. Cảm ơn bạn đã đồng hành xây dựng môi trường nghề nghiệp hòa nhập hơn.
                </motion.p>

                {submissionNote && (
                  <p className={`mb-6 rounded-xl px-4 py-3 text-sm ${
                    isDark ? 'bg-amber-500/10 text-amber-200' : 'bg-amber-50 text-amber-800'
                  }`}>
                    {submissionNote}
                  </p>
                )}
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button onClick={() => window.location.href = '/'}>
                    Về trang chủ
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
                {error && (
                  <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                    isDark ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'
                  }`} role="alert">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-zinc-300' : 'text-stone-700'
                    }`}>
                      Tên tổ chức *
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
                      placeholder="Công ty ABC"
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
                      Người liên hệ *
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
                      placeholder="Nguyễn Minh Anh"
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
                      Email *
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
                      placeholder="minhanh@example.com"
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
                      Số điện thoại
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
                      Quy mô tổ chức
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
                      <option value="">Chọn quy mô</option>
                      <option value="1-50">1-50 nhân sự</option>
                      <option value="51-200">51-200 nhân sự</option>
                      <option value="201-1000">201-1000 nhân sự</option>
                      <option value="1000+">Trên 1000 nhân sự</option>
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
                      Hình thức hợp tác *
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
                      <option value="">Chọn hình thức</option>
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
                    Website
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
                    Mục tiêu hợp tác
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
                    placeholder="Bạn muốn hợp tác với Avora theo cách nào?"
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
                        Đang gửi...
                      </motion.span>
                    ) : (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center"
                      >
                        Gửi thông tin hợp tác
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
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </motion.div>
        </motion.button>
      </main>
    </div>
  );
};

export default PartnersPage;
