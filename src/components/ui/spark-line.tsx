"use client";

interface Point {
  label: string; // x축 라벨 (예: "1차", "2/14")
  value: number; // 0~max 사이
}

interface Props {
  points: Point[];
  max?: number; // 미지정시 데이터 max
  height?: number;
  color?: string;
  unit?: string;
}

// 의존성 없는 미니 라인 차트. 점수 추이 등에 사용.
export function SparkLine({ points, max, height = 140, color = "#2563eb", unit = "" }: Props) {
  if (points.length === 0) return null;
  const w = 480;
  const padX = 36;
  const padY = 24;
  const maxVal = max ?? Math.max(...points.map((p) => p.value), 1);
  const minVal = 0;
  const range = maxVal - minVal || 1;

  const xStep = points.length > 1 ? (w - padX * 2) / (points.length - 1) : 0;
  const yFor = (v: number) => height - padY - ((v - minVal) / range) * (height - padY * 2);
  const xFor = (i: number) => padX + i * xStep;

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p.value)}`)
    .join(" ");

  // y축 눈금 4단계
  const ticks = [0, 0.33, 0.66, 1].map((t) => Math.round(minVal + range * t));

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full h-auto" role="img">
      {/* y grid */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line
            x1={padX}
            x2={w - padX / 2}
            y1={yFor(t)}
            y2={yFor(t)}
            stroke="#e5e7eb"
            strokeDasharray="2 3"
          />
          <text x={padX - 4} y={yFor(t) + 3} textAnchor="end" fontSize="10" fill="#9ca3af">
            {t}
            {unit}
          </text>
        </g>
      ))}
      {/* line */}
      <path d={path} fill="none" stroke={color} strokeWidth="2" />
      {/* points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={xFor(i)} cy={yFor(p.value)} r="4" fill={color} />
          <text
            x={xFor(i)}
            y={yFor(p.value) - 8}
            textAnchor="middle"
            fontSize="10"
            fill="#374151"
          >
            {p.value}
          </text>
          <text
            x={xFor(i)}
            y={height - 6}
            textAnchor="middle"
            fontSize="10"
            fill="#6b7280"
          >
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
