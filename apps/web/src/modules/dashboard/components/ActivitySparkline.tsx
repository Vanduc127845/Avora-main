type ActivitySparklineProps = {
  points: number[];
  labels?: string[];
  height?: number;
};

/**
 * Simple line chart (pure SVG) for the weekly activity section.
 */
export default function ActivitySparkline({ points, labels, height = 160 }: ActivitySparklineProps) {
  const width = 480;
  const padX = 8;
  const padY = 16;
  const max = Math.max(100, ...points);
  const stepX = (width - padX * 2) / Math.max(1, points.length - 1);

  const coords = points.map((value, i) => {
    const x = padX + i * stepX;
    const y = padY + (1 - value / max) * (height - padY * 2);
    return { x, y };
  });

  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' ');
  const area = `${line} L${coords[coords.length - 1]?.x ?? padX},${height - padY} L${padX},${height - padY} Z`;

  return (
    <div className="w-full">
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="block">
        <defs>
          <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(59,130,246,0.22)" />
            <stop offset="100%" stopColor="rgba(59,130,246,0)" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => (
          <line
            key={g}
            x1={padX}
            x2={width - padX}
            y1={padY + g * (height - padY * 2)}
            y2={padY + g * (height - padY * 2)}
            stroke="#F0EFEE"
            strokeWidth={1}
          />
        ))}
        <path d={area} fill="url(#spark-fill)" />
        <path d={line} fill="none" stroke="#3B82F6" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={3} fill="#fff" stroke="#3B82F6" strokeWidth={2} />
        ))}
      </svg>
      {labels && (
        <div className="mt-1 flex justify-between px-1 text-[10px] font-semibold text-stone-400">
          {labels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      )}
    </div>
  );
}
