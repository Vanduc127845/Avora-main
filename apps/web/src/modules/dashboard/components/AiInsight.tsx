import { Sparkles, Loader2 } from 'lucide-react';

type AiInsightProps = {
  eyebrow: string;
  body: string;
  loading?: boolean;
  loadingLabel?: string;
  actionLabel?: string;
  onAction?: () => void;
};

/**
 * AI-generated suggestion widget. Body text comes from the live /api/ai/chat
 * dashboard agent, so it is real personalized content, never hardcoded.
 */
export default function AiInsight({
  eyebrow,
  body,
  loading,
  loadingLabel,
  actionLabel,
  onAction,
}: AiInsightProps) {
  return (
    <div
      className="interactive-card rounded-[24px] border border-primary-100 p-5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary-950/5"
      style={{ background: 'linear-gradient(135deg, #F4EDFA 0%, #EDE9F8 100%)' }}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-primary-600 shadow-sm">
          <Sparkles className="h-4 w-4" />
        </span>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-700">{eyebrow}</p>
      </div>

      {loading ? (
        <p className="mt-3 flex items-center gap-2 text-sm font-medium text-primary-700/80">
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingLabel}
        </p>
      ) : (
        <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-stone-700">{body}</p>
      )}

      {actionLabel && onAction && !loading && (
        <button
          type="button"
          onClick={onAction}
          className="interactive-button mt-4 text-sm font-bold text-primary-700 hover:text-primary-800"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
