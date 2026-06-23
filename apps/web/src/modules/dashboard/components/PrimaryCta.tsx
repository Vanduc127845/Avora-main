import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

type PrimaryCtaProps = {
  eyebrow: string;
  title: string;
  description?: string;
  buttonLabel: string;
  to: string;
  variant?: 'dark' | 'accent';
};

/**
 * The single most important action on the dashboard. Use ONCE per page.
 */
export default function PrimaryCta({
  eyebrow,
  title,
  description,
  buttonLabel,
  to,
  variant = 'dark',
}: PrimaryCtaProps) {
  const shell =
    variant === 'dark'
      ? 'bg-stone-950 text-white hover:shadow-lg hover:shadow-stone-900/25'
      : 'bg-primary-600 text-white hover:shadow-lg hover:shadow-primary-500/25';
  const button =
    variant === 'dark'
      ? 'bg-white text-stone-950 hover:bg-stone-100'
      : 'bg-white text-primary-700 hover:bg-primary-50';

  return (
    <div
      className={`interactive-card flex flex-col gap-4 rounded-[24px] p-5 transition-all duration-200 ease-out hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between ${shell}`}
    >
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">{eyebrow}</p>
        <h3 className="mt-1.5 text-lg font-bold leading-tight">{title}</h3>
        {description && <p className="mt-1 text-sm font-medium text-white/70">{description}</p>}
      </div>
      <Link
        to={to}
        className={`interactive-button group inline-flex h-11 shrink-0 items-center justify-center rounded-full px-5 text-sm font-bold ${button}`}
      >
        {buttonLabel}
        <ArrowRight className="interactive-icon ml-2 h-4 w-4 group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
