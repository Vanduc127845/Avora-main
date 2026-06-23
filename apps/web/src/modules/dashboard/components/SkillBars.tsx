import type { Skill } from '../../../lib/shared';

const LEVEL_PERCENT: Record<Skill['level'], number> = {
  beginner: 25,
  intermediate: 50,
  advanced: 75,
  expert: 100,
};

type SkillBarsProps = {
  skills: Skill[];
  max?: number;
};

/**
 * Lightweight horizontal proficiency bars (no charting dependency).
 * Maps each skill level to a percentage and renders a labeled bar.
 */
export default function SkillBars({ skills, max = 6 }: SkillBarsProps) {
  const visible = skills.slice(0, max);

  return (
    <div className="space-y-3">
      {visible.map((skill) => {
        const percent = LEVEL_PERCENT[skill.level] ?? 25;
        return (
          <div key={skill.id || skill.name}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-semibold text-stone-700">{skill.name}</span>
              <span className="text-xs font-bold text-stone-400">{percent}%</span>
            </div>
            <div
              className="h-2.5 overflow-hidden rounded-full bg-stone-100"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={skill.name}
            >
              <div
                className="h-full rounded-full bg-primary-500 transition-[width] duration-500 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { LEVEL_PERCENT };
