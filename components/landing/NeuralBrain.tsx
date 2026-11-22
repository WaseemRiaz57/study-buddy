/**
 * The neural brain line drawing from the previous hero, redrawn in Lamplight
 * colours: paper strokes with highlighter nodes that pulse softly.
 */
const nodes: Array<[number, number]> = [
  [63, 42], [91, 78], [55, 112], [82, 137], [156, 42],
  [128, 78], [164, 112], [137, 137], [109, 55], [109, 111],
];

export default function NeuralBrain({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 180" fill="none" aria-hidden="true" className={`lamp-brain ${className}`}>
      <path
        d="M109 153c-13 14-36 7-37-11-18 6-35-10-27-27-18-4-23-29-8-40-10-18 7-38 26-34 5-20 31-24 44-9 13-15 39-11 44 9 20-4 36 16 26 34 16 11 10 36-8 40 8 17-9 33-27 27-1 18-24 25-37 11Z"
        stroke="var(--lamp-paper)"
        strokeWidth="1.25"
        vectorEffect="non-scaling-stroke"
        opacity=".55"
      />
      <path
        d="M109 32v121M74 43c14 8 21 19 19 34M53 77c17-1 31 7 38 20M45 115c18-7 34-2 45 12M145 43c-14 8-21 19-19 34M166 77c-17-1-31 7-38 20M174 115c-18-7-34-2-45 12"
        stroke="var(--lamp-paper)"
        strokeLinecap="round"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
        opacity=".4"
      />
      {nodes.map(([cx, cy], i) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r="1.7"
          fill="var(--lamp-marker)"
          className="lamp-brain-node"
          style={{ "--d": `${i * 340}ms` } as React.CSSProperties}
        />
      ))}
    </svg>
  );
}
