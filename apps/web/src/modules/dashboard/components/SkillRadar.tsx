export type RadarAxis = {
  label: string;
  /** 0-100 */
  value: number;
};

type SkillRadarProps = {
  axes: RadarAxis[];
  size?: number;
};

const polar = (cx: number, cy: number, r: number, angle: number) => ({
  x: cx + r * Math.cos(angle),
  y: cy + r * Math.sin(angle),
});

/**
 * Lightweight radar / spider chart drawn with pure SVG (no chart dependency).
 * Labels are stacked (name over percentage) so they never clip at the edges.
 */
export default function SkillRadar({ axes, size = 300 }: SkillRadarProps) {
  const cx = size / 2;
  const cy = size / 2;
  // Generous outer margin so two-line labels fit inside the viewBox.
  const maxR = size / 2 - 58;
  const n = axes.length;
  const angleFor = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const rings = [0.25, 0.5, 0.75, 1];

  const valuePoints = axes
    .map((axis, i) => {
      const r = (Math.max(0, Math.min(100, axis.value)) / 100) * maxR;
      const p = polar(cx, cy, r, angleFor(i));
      return `${p.x},${p.y}`;
    })
    .join(' ');

  return (
    <svg width="100%" viewBox={`0 0 ${size} ${size}`} className="mx-auto block w-full max-w-[380px]">
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={axes
            .map((_, i) => {
              const p = polar(cx, cy, maxR * ring, angleFor(i));
              return `${p.x},${p.y}`;
            })
            .join(' ')}
          fill="none"
          stroke="#E7E5E4"
          strokeWidth={1}
        />
      ))}
      {axes.map((_, i) => {
        const p = polar(cx, cy, maxR, angleFor(i));
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#E7E5E4" strokeWidth={1} />;
      })}
      <polygon points={valuePoints} fill="rgba(59,130,246,0.18)" stroke="#3B82F6" strokeWidth={2} />
      {axes.map((axis, i) => {
        const r = (Math.max(0, Math.min(100, axis.value)) / 100) * maxR;
        const p = polar(cx, cy, r, angleFor(i));
        return <circle key={i} cx={p.x} cy={p.y} r={3} fill="#3B82F6" />;
      })}
      {axes.map((axis, i) => {
        const angle = angleFor(i);
        const p = polar(cx, cy, maxR + 20, angle);
        const anchor = Math.abs(p.x - cx) < 12 ? 'middle' : p.x < cx ? 'end' : 'start';
        return (
          <text key={i} x={p.x} y={p.y} textAnchor={anchor} dominantBaseline="middle">
            <tspan x={p.x} dy="-2" className="fill-stone-600" style={{ fontSize: 11, fontWeight: 700 }}>
              {axis.label}
            </tspan>
            <tspan x={p.x} dy="13" className="fill-stone-400" style={{ fontSize: 10, fontWeight: 600 }}>
              {Math.round(axis.value)}%
            </tspan>
          </text>
        );
      })}
    </svg>
  );
}
