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
 */
export default function SkillRadar({ axes, size = 240 }: SkillRadarProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 34;
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
    <svg width="100%" viewBox={`0 0 ${size} ${size}`} className="mx-auto block max-w-[280px]">
      {/* grid rings */}
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
      {/* spokes */}
      {axes.map((_, i) => {
        const p = polar(cx, cy, maxR, angleFor(i));
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#E7E5E4" strokeWidth={1} />;
      })}
      {/* value area */}
      <polygon points={valuePoints} fill="rgba(59,130,246,0.18)" stroke="#3B82F6" strokeWidth={2} />
      {axes.map((axis, i) => {
        const r = (Math.max(0, Math.min(100, axis.value)) / 100) * maxR;
        const p = polar(cx, cy, r, angleFor(i));
        return <circle key={i} cx={p.x} cy={p.y} r={3} fill="#3B82F6" />;
      })}
      {/* labels */}
      {axes.map((axis, i) => {
        const p = polar(cx, cy, maxR + 18, angleFor(i));
        const anchor = Math.abs(p.x - cx) < 8 ? 'middle' : p.x < cx ? 'end' : 'start';
        return (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor={anchor}
            dominantBaseline="middle"
            className="fill-stone-500"
            style={{ fontSize: 10, fontWeight: 600 }}
          >
            {axis.label}
            <tspan className="fill-stone-400" style={{ fontSize: 9 }}>{` ${Math.round(axis.value)}%`}</tspan>
          </text>
        );
      })}
    </svg>
  );
}
