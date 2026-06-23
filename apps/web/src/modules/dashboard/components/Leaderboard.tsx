import { useTranslation } from 'react-i18next';

export type LeaderboardEntry = {
  rank: number;
  name: string;
  level: number;
  xp: number;
  isCurrentUser?: boolean;
};

type LeaderboardProps = {
  entries: LeaderboardEntry[];
};

const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export default function Leaderboard({ entries }: LeaderboardProps) {
  const { t } = useTranslation();

  return (
    <ul className="space-y-2">
      {entries.map((entry) => (
        <li
          key={entry.rank}
          className={`flex items-center gap-3 rounded-[14px] border px-3 py-2 ${
            entry.isCurrentUser
              ? 'border-primary-300 bg-primary-50'
              : 'border-stone-100 bg-stone-50'
          }`}
        >
          <span className="w-4 text-sm font-bold text-stone-400">{entry.rank}</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-primary-700 shadow-sm">
            {initials(entry.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-stone-950">
              {entry.isCurrentUser ? t('dashboard.leaderboard.you') : entry.name}
            </p>
            <p className="text-[11px] font-semibold text-stone-400">
              {t('dashboard.leaderboard.level', { n: entry.level })}
            </p>
          </div>
          <span className="text-xs font-bold text-stone-700">{entry.xp.toLocaleString()} XP</span>
        </li>
      ))}
    </ul>
  );
}
