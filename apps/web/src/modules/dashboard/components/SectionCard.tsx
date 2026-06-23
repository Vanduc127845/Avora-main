import React from 'react';

type SectionCardProps = {
  eyebrow?: string;
  title?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

/**
 * Consistent white section wrapper for the vertical dashboard layout.
 * Keeps the existing rounded / border / hover design tokens.
 */
export default function SectionCard({ eyebrow, title, action, className, children }: SectionCardProps) {
  return (
    <section
      className={`interactive-card rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md hover:shadow-sky-950/5 ${className || ''}`}
    >
      {(eyebrow || title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-400">{eyebrow}</p>
            )}
            {title && <h2 className="mt-1 text-xl font-bold text-stone-950">{title}</h2>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
