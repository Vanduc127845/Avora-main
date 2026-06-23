import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description: string;
  ctaLabel?: string;
  to?: string;
};

/**
 * Friendly placeholder for sections without data yet — shown instead of a
 * bare "0%" or "Not set".
 */
export default function EmptyState({ icon, title, description, ctaLabel, to }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-[20px] border border-dashed border-stone-200 bg-stone-50 p-5 text-left">
      {icon && (
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary-600 shadow-sm">
          {icon}
        </span>
      )}
      <div>
        <p className="text-sm font-bold text-stone-950">{title}</p>
        <p className="mt-1 text-sm leading-6 text-stone-500">{description}</p>
      </div>
      {ctaLabel && to && (
        <Link
          to={to}
          className="interactive-button group inline-flex items-center text-sm font-bold text-primary-700 hover:text-primary-800"
        >
          {ctaLabel}
          <ArrowRight className="interactive-icon ml-1.5 h-4 w-4 group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
