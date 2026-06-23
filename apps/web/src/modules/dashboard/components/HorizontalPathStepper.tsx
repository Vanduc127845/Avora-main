import { Check, Lock } from 'lucide-react';
import type { PathStep } from './LearningPathStepper';

type HorizontalPathStepperProps = {
  steps: PathStep[];
};

/**
 * Horizontal learning-path stepper (e.g. HTML/CSS → JavaScript → React → …).
 * Tech/skill names are kept as-is (product/technical terms).
 */
export default function HorizontalPathStepper({ steps }: HorizontalPathStepperProps) {
  return (
    <div className="flex items-start gap-1 overflow-x-auto pb-1">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const circle =
          step.status === 'done'
            ? 'bg-emerald-500 text-white border-emerald-500'
            : step.status === 'current'
              ? 'bg-white text-primary-700 border-primary-500 ring-4 ring-primary-100'
              : 'bg-stone-50 text-stone-400 border-stone-200';
        const label = step.status === 'current' ? 'text-primary-700 font-bold' : 'text-stone-500 font-semibold';

        return (
          <div key={`${step.name}-${index}`} className="flex min-w-0 flex-1 items-start">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold ${circle}`}
                aria-current={step.status === 'current' ? 'step' : undefined}
              >
                {step.status === 'done' ? (
                  <Check className="h-4 w-4" />
                ) : step.status === 'locked' ? (
                  <Lock className="h-3.5 w-3.5" />
                ) : (
                  index + 1
                )}
              </span>
              <span className={`max-w-[80px] truncate text-center text-[11px] ${label}`} title={step.name}>
                {step.name}
              </span>
            </div>
            {!isLast && (
              <span
                className={`mt-4 h-0.5 w-6 shrink-0 rounded-full ${
                  step.status === 'done' ? 'bg-emerald-400' : 'bg-stone-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
