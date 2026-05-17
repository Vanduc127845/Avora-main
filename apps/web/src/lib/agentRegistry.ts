export type AgentId =
  | 'dashboard'
  | 'profile'
  | 'assessment'
  | 'jobs'
  | 'roadmaps'
  | 'interviews'
  | 'confidence'
  | 'simulation'
  | 'settings'
  | 'help'
  | 'general';

export type AgentConfig = {
  id: AgentId;
  path: string;
  label: string;
  agentName: string;
  scope: string;
  opening: string;
  lastActiveLabel: string;
  accent: {
    border: string;
    bg: string;
    softBg: string;
    text: string;
    iconBg: string;
    ring: string;
  };
};

export const navigationAgents: AgentConfig[] = [
  {
    id: 'dashboard',
    path: '/dashboard',
    label: 'Tổng quan',
    agentName: 'Agent tổng quan',
    scope: 'Theo dõi tiến độ và hành động tiếp theo',
    opening: 'Tôi là Agent tổng quan. Tôi có thể tóm tắt tiến độ, phát hiện việc đang bị kẹt và kết nối bạn tới công cụ Avora phù hợp.',
    lastActiveLabel: 'Chưa hoạt động',
    accent: {
      border: 'border-l-slate-500',
      bg: 'bg-slate-600',
      softBg: 'bg-slate-50',
      text: 'text-slate-700',
      iconBg: 'bg-slate-600',
      ring: 'ring-slate-100',
    },
  },
  {
    id: 'profile',
    path: '/profile',
    label: 'Hồ sơ',
    agentName: 'Agent hồ sơ',
    scope: 'Kỹ năng, nhu cầu hỗ trợ và sở thích làm việc',
    opening: 'Tôi là Agent hồ sơ. Tôi giúp bạn làm rõ kỹ năng, sở thích làm việc, nhu cầu trợ năng và thông tin nên lưu trong hồ sơ.',
    lastActiveLabel: 'Chưa hoạt động',
    accent: {
      border: 'border-l-emerald-500',
      bg: 'bg-emerald-600',
      softBg: 'bg-emerald-50',
      text: 'text-emerald-700',
      iconBg: 'bg-emerald-600',
      ring: 'ring-emerald-100',
    },
  },
  {
    id: 'assessment',
    path: '/assessment',
    label: 'Đánh giá',
    agentName: 'Agent đánh giá nghề nghiệp',
    scope: 'Điều phối JD, hồ sơ, gap, lộ trình và phỏng vấn',
    opening: 'Tôi giúp bạn phân tích một JD cụ thể, so sánh với hồ sơ thật và tổng hợp lộ trình cá nhân hóa.',
    lastActiveLabel: 'Chưa hoạt động',
    accent: {
      border: 'border-l-sky-500',
      bg: 'bg-sky-600',
      softBg: 'bg-sky-50',
      text: 'text-sky-700',
      iconBg: 'bg-sky-600',
      ring: 'ring-sky-100',
    },
  },
  {
    id: 'jobs',
    path: '/jobs',
    label: 'Việc làm',
    agentName: 'Agent việc làm',
    scope: 'Phân tích JD, độ phù hợp và kỹ năng còn thiếu',
    opening: 'Tôi là Agent việc làm. Hãy chọn hoặc mô tả một vị trí, tôi sẽ phân tích JD, kỹ năng thiếu, tín hiệu trợ năng và bước tiếp theo.',
    lastActiveLabel: 'Chưa hoạt động',
    accent: {
      border: 'border-l-amber-500',
      bg: 'bg-amber-600',
      softBg: 'bg-amber-50',
      text: 'text-amber-700',
      iconBg: 'bg-amber-600',
      ring: 'ring-amber-100',
    },
  },
  {
    id: 'roadmaps',
    path: '/roadmaps',
    label: 'Lộ trình',
    agentName: 'Agent lộ trình',
    scope: 'Kế hoạch học theo khoảng trống kỹ năng',
    opening: 'Tôi là Agent lộ trình. Tôi biến gap kỹ năng từ JD thành kế hoạch học theo tuần, bài thực hành và bằng chứng portfolio.',
    lastActiveLabel: 'Chưa hoạt động',
    accent: {
      border: 'border-l-indigo-500',
      bg: 'bg-indigo-600',
      softBg: 'bg-indigo-50',
      text: 'text-indigo-700',
      iconBg: 'bg-indigo-600',
      ring: 'ring-indigo-100',
    },
  },
  {
    id: 'interviews',
    path: '/interviews',
    label: 'Phỏng vấn',
    agentName: 'Agent phỏng vấn',
    scope: 'Câu hỏi phỏng vấn và luyện trả lời theo JD',
    opening: 'Tôi là Agent phỏng vấn. Tôi tạo câu hỏi theo vị trí cụ thể, cải thiện câu trả lời và giúp bạn yêu cầu hỗ trợ chuyên nghiệp.',
    lastActiveLabel: 'Chưa hoạt động',
    accent: {
      border: 'border-l-fuchsia-500',
      bg: 'bg-fuchsia-600',
      softBg: 'bg-fuchsia-50',
      text: 'text-fuchsia-700',
      iconBg: 'bg-fuchsia-600',
      ring: 'ring-fuchsia-100',
    },
  },
  {
    id: 'confidence',
    path: '/confidence',
    label: 'Tự tin',
    agentName: 'Agent tự tin',
    scope: 'Tự tin ứng tuyển và kịch bản giao tiếp',
    opening: 'Tôi là Agent tự tin. Tôi giúp bạn biến lo lắng thành kịch bản, ranh giới và hành động nhỏ để tăng tự tin.',
    lastActiveLabel: 'Chưa hoạt động',
    accent: {
      border: 'border-l-rose-500',
      bg: 'bg-rose-600',
      softBg: 'bg-rose-50',
      text: 'text-rose-700',
      iconBg: 'bg-rose-600',
      ring: 'ring-rose-100',
    },
  },
  {
    id: 'simulation',
    path: '/simulation',
    label: 'Mô phỏng',
    agentName: 'Agent mô phỏng',
    scope: 'Tình huống công việc và luyện phản hồi',
    opening: 'Tôi là Agent mô phỏng. Tôi tạo tình huống công việc thực tế và giúp bạn chọn cách nói hoặc làm tiếp theo.',
    lastActiveLabel: 'Chưa hoạt động',
    accent: {
      border: 'border-l-teal-500',
      bg: 'bg-teal-600',
      softBg: 'bg-teal-50',
      text: 'text-teal-700',
      iconBg: 'bg-teal-600',
      ring: 'ring-teal-100',
    },
  },
  {
    id: 'settings',
    path: '/settings',
    label: 'Cài đặt',
    agentName: 'Agent cài đặt',
    scope: 'Trợ năng, quyền riêng tư và thiết lập ứng dụng',
    opening: 'Tôi là Agent cài đặt. Tôi giúp tinh chỉnh trợ năng, thông báo, quyền riêng tư và luồng làm việc.',
    lastActiveLabel: 'Chưa hoạt động',
    accent: {
      border: 'border-l-zinc-500',
      bg: 'bg-zinc-600',
      softBg: 'bg-zinc-50',
      text: 'text-zinc-700',
      iconBg: 'bg-zinc-600',
      ring: 'ring-zinc-100',
    },
  },
  {
    id: 'help',
    path: '/docs',
    label: 'Trợ giúp',
    agentName: 'Agent trợ giúp',
    scope: 'Hướng dẫn tính năng và thiết lập',
    opening: 'Tôi là Agent trợ giúp. Tôi giải thích cách dùng Avora, thiết lập ứng dụng và tìm đúng tính năng.',
    lastActiveLabel: 'Chưa hoạt động',
    accent: {
      border: 'border-l-cyan-500',
      bg: 'bg-cyan-600',
      softBg: 'bg-cyan-50',
      text: 'text-cyan-700',
      iconBg: 'bg-cyan-600',
      ring: 'ring-cyan-100',
    },
  },
];

const defaultAgent: AgentConfig = {
  id: 'general',
  path: '/',
  label: 'Avora',
  agentName: 'Agent Avora chung',
  scope: 'Hỗ trợ nghề nghiệp và trợ năng',
  opening: 'Tôi là Avora. Hãy nói bạn đang muốn làm gì, tôi sẽ chuyển tới agent phù hợp hoặc đưa bước tiếp theo trực tiếp.',
  lastActiveLabel: 'Chưa hoạt động',
  accent: {
    border: 'border-l-primary-500',
    bg: 'bg-primary-600',
    softBg: 'bg-primary-50',
    text: 'text-primary-700',
    iconBg: 'bg-primary-600',
    ring: 'ring-primary-100',
  },
};

export const getAgentForPath = (pathname: string): AgentConfig => {
  const match = navigationAgents
    .filter((agent) => pathname === agent.path || pathname.startsWith(`${agent.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0];

  return match || defaultAgent;
};
