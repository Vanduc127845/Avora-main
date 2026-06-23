import { Check } from 'lucide-react';

export type MilestoneStep = {
  label: string;
  status: 'done' | 'current' | 'locked';
};

type MilestoneStepperProps = {
  steps: MilestoneStep[];
  caption?: string;
};

/**
 * Step-based progress indicator (Profile → Assessment → Jobs → Interview).
 * Replaces the bare "X% ready" number with a story the user can follow.
 */
export default function MilestoneStepper({ steps, caption }: MilestoneStepperProps) {
  return (
    <div>
      <div className="flex items-center gap-2">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const dotClass =
            step.status === 'done'
              ? 'bg-primary-500 text-white border-primary-500'
              : step.status === 'current'
                ? 'bg-white text-primary-700 border-primary-500 ring-4 ring-primary-100'
                : 'bg-stone-50 text-stone-400 border-stone-200';
          const lineClass = step.status === 'done' ? 'bg-primary-400' : 'bg-stone-200';

          return (
            <div key={step.label} className="flex flex-1 items-center gap-2">
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${dotClass}`}
                  aria-current={step.status === 'current' ? 'step' : undefined}
                >
                  {step.status === 'done' ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span
                  className={`max-w-[72px] truncate text-center text-[11px] font-semibold ${
                    step.status === 'locked' ? 'text-stone-400' : 'text-stone-700'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && <span className={`h-0.5 flex-1 rounded-full ${lineClass}`} />}
            </div>
          );
        })}
      </div>
      {caption && <p className="mt-3 text-sm font-medium text-stone-500">{caption}</p>}
    </div>
  );
}
