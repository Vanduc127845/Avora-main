import React from 'react';
import { aiService } from '../../../services';

type InsightInput = {
  /** Whether the profile has enough data to be worth an AI call. */
  ready: boolean;
  targetRole?: string;
  skills: string[];
  savedJobs: number;
  roadmaps: number;
};

type InsightState = {
  text: string;
  loading: boolean;
};

/**
 * Generates a short, personalized dashboard suggestion via the live
 * /api/ai/chat dashboard agent. Runs once per input signature, and only
 * when there is enough profile data to make the call worthwhile.
 */
export function useDashboardInsight(input: InsightInput): InsightState {
  const [state, setState] = React.useState<InsightState>({ text: '', loading: false });
  const signature = `${input.ready}|${input.targetRole || ''}|${input.skills.join(',')}|${input.savedJobs}|${input.roadmaps}`;

  React.useEffect(() => {
    if (!input.ready) {
      setState({ text: '', loading: false });
      return;
    }

    let active = true;
    setState({ text: '', loading: true });

    const message = [
      'Dựa trên hồ sơ tóm tắt sau, đưa ra MỘT gợi ý ngắn (2-3 câu) giúp tôi tiến gần hơn tới việc làm phù hợp.',
      `Vai trò mục tiêu: ${input.targetRole || 'chưa rõ'}.`,
      `Kỹ năng hiện có: ${input.skills.length ? input.skills.join(', ') : 'chưa có'}.`,
      `Số việc đã lưu: ${input.savedJobs}. Số lộ trình: ${input.roadmaps}.`,
      'Nói thẳng vào hành động cụ thể tiếp theo, không lặp lại dữ liệu trên.',
    ].join('\n');

    aiService
      .chat({
        message,
        context: {
          agentId: 'dashboard',
          routePath: '/dashboard',
          moduleTitle: 'Tổng quan',
          concise: true,
        },
      })
      .then((res) => {
        if (active) setState({ text: res.response?.trim() || '', loading: false });
      })
      .catch(() => {
        if (active) setState({ text: '', loading: false });
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return state;
}
