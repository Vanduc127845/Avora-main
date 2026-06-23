import { Check, Lock } from 'lucide-react';

export type PathStep = {
  name: string;
  status: 'done' | 'current' | 'locked';
};

type LearningPathStepperProps = {
  steps: PathStep[];
};

/**
 * Vertical stepper for a roadmap's phases (built from real roadmap.phases).
 */
export default function LearningPathStepper({ steps }: LearningPathStepperProps) {
  return (
    <ol className="space-y-1">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const circle =
          step.status === 'done'
            ? 'bg-primary-500 text-white border-primary-500'
            : step.status === 'current'
              ? 'bg-white text-primary-700 border-primary-500 ring-4 ring-primary-100'
              : 'bg-stone-50 text-stone-400 border-stone-200';
        const label =
          step.status === 'locked' ? 'text-stone-400' : 'font-semibold text-stone-800';

        return (
          <li key={`${step.name}-${index}`} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold ${circle}`}
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
              {!isLast && <span className="my-1 w-0.5 flex-1 rounded-full bg-stone-200" />}
            </div>
            <div className={`min-w-0 pb-4 pt-1 text-sm ${label}`}>
              <span className="truncate">{step.name}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
