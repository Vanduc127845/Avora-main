import React from 'react';
import { Bot, ChevronRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { getAgentForPath, type AgentId } from '../../lib/agentRegistry';
import { agentMemoryService } from '../../services';

const agentActions: Record<AgentId, string[]> = {
  dashboard: ['Tóm tắt tiến độ', 'Chọn hành động tiếp theo', 'Tìm phần đang kẹt'],
  profile: ['Rà soát kỹ năng', 'Làm rõ nhu cầu hỗ trợ', 'Cập nhật sở thích làm việc'],
  assessment: ['Tổng hợp agent', 'Đề xuất hướng nghề', 'Biến tín hiệu thành kế hoạch'],
  jobs: ['Phân tích JD', 'Tìm kỹ năng thiếu', 'Kiểm tra độ phù hợp trợ năng'],
  roadmaps: ['Tạo lộ trình học', 'Ưu tiên gap', 'Lập bằng chứng portfolio'],
  interviews: ['Tạo câu hỏi thử', 'Cải thiện câu trả lời', 'Luyện yêu cầu hỗ trợ'],
  confidence: ['Viết kịch bản tự tin', 'Giảm điểm kẹt', 'Tạo bước nhỏ'],
  simulation: ['Chạy tình huống công việc', 'So sánh lựa chọn', 'Luyện phản hồi'],
  settings: ['Tinh chỉnh trợ năng', 'Kiểm tra quyền riêng tư', 'Sửa thiết lập'],
  help: ['Giải thích tính năng', 'Hướng dẫn thiết lập', 'Tìm tài liệu'],
  general: ['Chuyển đúng agent', 'Trả lời câu đơn giản', 'Gợi ý bước tiếp theo'],
};

export default function AgentContextBanner() {
  const location = useLocation();
  const agent = getAgentForPath(location.pathname);
  const actions = agentActions[agent.id] || agentActions.general;
  const [memoryText, setMemoryText] = React.useState('Chưa có ngữ cảnh phiên.');

  React.useEffect(() => {
    const controller = new AbortController();
    agentMemoryService
      .list(controller.signal)
      .then((response) => {
        const memory = response.memories.find((item) => item.agentId === agent.id);
        if (!memory) {
          setMemoryText('Chưa có ngữ cảnh phiên.');
          return;
        }
        setMemoryText(memory.facts.slice(-1)[0] || memory.summary || 'Agent đã có ngữ cảnh phiên gần đây.');
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [agent.id]);

  if (agent.id === 'assessment') return null;

  const openAgentChat = () => {
    window.dispatchEvent(new CustomEvent('avora:open-agent-chat'));
  };

  return (
    <section
      className="interactive-card group mb-6 overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-sm hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md hover:shadow-sky-950/5"
      aria-label={`Ngữ cảnh ${agent.agentName}`}
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="interactive-icon flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-white group-hover:scale-105">
            <Bot className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-primary-700">Agent AI đang hoạt động</p>
              <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-bold text-primary-700">
                Chuyên trách
              </span>
            </div>
            <h2 className="mt-1 text-lg font-bold text-stone-950">{agent.agentName}</h2>
            <p className="mt-1 max-w-3xl text-sm text-stone-600">{agent.opening}</p>
            <p className="mt-2 max-w-3xl truncate text-xs font-semibold text-stone-500">
              Bộ nhớ phiên: {memoryText}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openAgentChat}
          className="interactive-button group inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/25"
        >
          Mở {agent.agentName}
          <ChevronRight className="interactive-icon h-4 w-4 group-hover:translate-x-0.5" />
        </button>
      </div>

      <div className="border-t border-primary-50 bg-primary-50/40 px-4 py-3">
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <span key={action} className="interactive-card rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-700 ring-1 ring-primary-100 hover:-translate-y-0.5 hover:bg-primary-50 hover:text-primary-800 hover:ring-primary-200">
              {action}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
