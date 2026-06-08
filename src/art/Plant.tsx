/**
 * The tomato plant, drawn as hand-authored SVG. It morphs by life-cycle `stage`
 * and reacts to its `mood` (wilting, yellowing, cold, ...). Polished vector
 * cartoon style: cel-shaded rounded leaves, thick outlines, glossy fruit.
 */
import type { Stage, Mood } from '../sim/stages';

interface LeafSpec {
  cx: number;
  cy: number;
  rot: number;
  scale: number;
  baby?: boolean;
  back?: boolean;
}

// Leaf geometry: base at (20,46), tip at (20,2).
const LEAF_PATH = 'M20 46 C2 38 1 14 20 2 C39 14 38 38 20 46 Z';
const LEAF_HI = 'M20 43 C8 36 6 17 19 6 C18 20 18 33 20 43 Z';
// Baby leaf (cotyledon): chubby, round.
const BABY_PATH = 'M20 44 C5 44 3 22 20 12 C37 22 35 44 20 44 Z';
const BABY_HI = 'M20 41 C10 41 8 24 19 16 C18 26 18 36 20 41 Z';

function Leaf({ cx, cy, rot, scale, baby, back, leafGrad }: LeafSpec & { leafGrad: string }) {
  const path = baby ? BABY_PATH : LEAF_PATH;
  const hi = baby ? BABY_HI : LEAF_HI;
  const stroke = back ? '#21501a' : '#27571d';
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rot}) scale(${scale}) translate(-20 -46)`}>
      <path d={path} fill={`url(#${leafGrad})`} stroke={stroke} strokeWidth={2.6} strokeLinejoin="round" />
      <path d={hi} fill="url(#leafHi)" opacity={0.75} />
      {!baby && (
        <path d="M20 43 L20 7" stroke={stroke} strokeWidth={1.6} opacity={0.5} fill="none" strokeLinecap="round" />
      )}
    </g>
  );
}

function Tomato({ x, y, scale = 1, ripe = true }: { x: number; y: number; scale?: number; ripe?: boolean }) {
  if (!ripe) {
    return (
      <g transform={`translate(${x} ${y}) scale(${scale})`}>
        <circle cx={14} cy={14} r={10.5} fill="#7cc04f" stroke="#3f8430" strokeWidth={2.4} />
        <ellipse cx={10} cy={10} rx={3.2} ry={2} fill="#fff" opacity={0.4} />
      </g>
    );
  }
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle cx={24} cy={27} r={18} fill="url(#tomato)" stroke="#a32614" strokeWidth={2.6} />
      <path
        d="M24 12 l2.6 4.2 4.6-1.6-1.6 4.4 4.6 1.8-4.6 1.8 1 4.4-4.6-1.6-2 4.4-2.4-4.4-4.4 1.6 1-4.4-4.6-1.8 4.6-1.8-1.6-4.4 4.6 1.6z"
        fill="#57a23c"
        stroke="#2f6b25"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <ellipse cx={16} cy={20} rx={6} ry={3.8} fill="#fff" opacity={0.55} transform="rotate(-32 16 20)" />
    </g>
  );
}

function Flower({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g fill="#ffd24d" stroke="#e0a52e" strokeWidth={1.1}>
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx={0} cy={-7} rx={3.3} ry={6} transform={`rotate(${a})`} />
        ))}
      </g>
      <circle cx={0} cy={0} r={3.4} fill="#f0a930" stroke="#c9871f" strokeWidth={1} />
    </g>
  );
}

/** Per-stage composition: stem path, leaves, fruit/flowers, whether a stake shows. */
function composition(stage: Stage) {
  const baseX = 160;
  const baseY = 286;
  switch (stage) {
    case 'seed':
      return { stem: '', leaves: [] as LeafSpec[], flowers: [], tomatoes: [], green: [], stake: false, seed: true };
    case 'sprout':
      return {
        stem: `M${baseX} ${baseY} L${baseX} 250`,
        leaves: [
          { cx: baseX, cy: 252, rot: -52, scale: 0.7, baby: true },
          { cx: baseX, cy: 252, rot: 52, scale: 0.7, baby: true },
        ],
        flowers: [], tomatoes: [], green: [], stake: false, seed: false,
      };
    case 'seedling':
      return {
        stem: `M${baseX} ${baseY} C${baseX - 3} 250 ${baseX + 3} 225 ${baseX} 205`,
        leaves: [
          { cx: baseX, cy: 250, rot: -54, scale: 0.85, baby: true },
          { cx: baseX, cy: 250, rot: 54, scale: 0.85, baby: true },
          { cx: baseX, cy: 210, rot: -20, scale: 0.8 },
          { cx: baseX, cy: 210, rot: 22, scale: 0.8 },
        ],
        flowers: [], tomatoes: [], green: [], stake: false, seed: false,
      };
    default: {
      // vegetative skeleton shared by leafy / flowering / fruiting / ripe
      const leaves: LeafSpec[] = [
        { cx: baseX, cy: 255, rot: -62, scale: 1.0, back: true },
        { cx: baseX, cy: 255, rot: 62, scale: 1.0, back: true },
        { cx: baseX, cy: 220, rot: -50, scale: 1.05 },
        { cx: baseX, cy: 220, rot: 50, scale: 1.05 },
        { cx: baseX, cy: 188, rot: -34, scale: 0.95 },
        { cx: baseX, cy: 188, rot: 36, scale: 0.95 },
        { cx: baseX, cy: 158, rot: -14, scale: 0.9 },
        { cx: baseX, cy: 158, rot: 16, scale: 0.9 },
      ];
      const stem = `M${baseX} ${baseY} C${baseX - 4} 240 ${baseX + 4} 200 ${baseX} 150`;
      return { stem, leaves, flowers: [], tomatoes: [], green: [], stake: false, seed: false };
    }
  }
}

const LEAF_GRAD: Record<Mood, string> = {
  healthy: 'leafG',
  wilting: 'leafG',
  drowning: 'leafG',
  leggy: 'leafG',
  scorched: 'leafScorch',
  cold: 'leafG',
  yellowing: 'leafYellow',
  dead: 'leafDead',
};

const MOOD_FILTER: Record<Mood, string | undefined> = {
  healthy: undefined,
  wilting: 'saturate(.82) brightness(.97)',
  drowning: 'saturate(.85) brightness(.96)',
  leggy: 'saturate(.9) brightness(1.02)',
  scorched: 'saturate(.95)',
  cold: 'saturate(.78) brightness(.97) hue-rotate(-8deg)',
  yellowing: undefined,
  dead: 'grayscale(.45) sepia(.35) brightness(.88)',
};

export default function Plant({ stage, mood }: { stage: Stage; mood: Mood }) {
  const c = composition(stage);
  const grad = LEAF_GRAD[mood];
  const droop = mood === 'wilting' || mood === 'drowning' || mood === 'scorched' || mood === 'dead';
  const leggy = mood === 'leggy';

  // Wilting/dead: leaves sag outward & down. Leggy: stem stretches, leaves shrink.
  const leaves = c.leaves.map((l) => {
    let rot = l.rot;
    let scale = l.scale;
    if (droop) rot += Math.sign(l.rot || 1) * 22;
    if (leggy) scale *= 0.8;
    return { ...l, rot, scale };
  });

  const showFruit = stage === 'fruiting' || stage === 'ripe';
  const showFlowers = stage === 'flowering';
  const ripe = stage === 'ripe' && mood !== 'dead';

  return (
    <svg viewBox="0 0 320 330" width="100%" height="100%" role="img" aria-label={`Tomato plant, stage ${stage}, ${mood}`}>
      <defs>
        <linearGradient id="leafG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fce63" /><stop offset="1" stopColor="#5ba23f" />
        </linearGradient>
        <linearGradient id="leafYellow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e7e06a" /><stop offset="1" stopColor="#bcb84a" />
        </linearGradient>
        <linearGradient id="leafScorch" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9cba5a" /><stop offset="1" stopColor="#8a7a3a" />
        </linearGradient>
        <linearGradient id="leafDead" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b59a6a" /><stop offset="1" stopColor="#8a6f47" />
        </linearGradient>
        <linearGradient id="leafHi" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c6ec97" /><stop offset="0.7" stopColor="#c6ec97" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="tomato" cx="36%" cy="30%" r="75%">
          <stop offset="0" stopColor="#ff7e5e" /><stop offset="0.5" stopColor="#ef4f2c" /><stop offset="1" stopColor="#cc2c1a" />
        </radialGradient>
        <radialGradient id="mound" cx="50%" cy="35%" r="70%">
          <stop offset="0" stopColor="#9c6638" /><stop offset="1" stopColor="#794c28" />
        </radialGradient>
        <linearGradient id="stake" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a9743f" /><stop offset="0.5" stopColor="#c89058" /><stop offset="1" stopColor="#8f5e30" />
        </linearGradient>
      </defs>

      {/* ground shadow + soil mound */}
      <ellipse cx={160} cy={300} rx={96} ry={16} fill="#000" opacity={0.1} />
      <ellipse cx={160} cy={290} rx={70} ry={18} fill="url(#mound)" />
      <ellipse cx={160} cy={285} rx={70} ry={14} fill="#a06b3e" />

      {c.seed && <ellipse cx={160} cy={283} rx={7} ry={5} fill="#caa15f" stroke="#9a7740" strokeWidth={1.5} />}

      {/* stake for fruiting/ripe */}
      {(stage === 'fruiting' || stage === 'ripe') && (
        <g transform="translate(186 286)">
          <rect x={-5} y={-150} width={10} height={154} rx={4} fill="url(#stake)" stroke="#6e4824" strokeWidth={2.4} />
          <ellipse cx={0} cy={-150} rx={5} ry={2.6} fill="#d6a875" stroke="#6e4824" strokeWidth={2} />
        </g>
      )}

      <g style={{ filter: MOOD_FILTER[mood] }}>
        {c.stem && (
          <path d={c.stem} stroke={mood === 'dead' ? '#8a6f47' : '#4e8c39'} strokeWidth={leggy ? 5 : 8} fill="none" strokeLinecap="round" />
        )}
        {leaves.map((l, i) => (
          <Leaf key={i} {...l} leafGrad={l.back ? grad : grad} />
        ))}
        {showFlowers && (
          <>
            <Flower x={132} y={176} />
            <Flower x={190} y={168} />
            <Flower x={160} y={146} />
          </>
        )}
        {showFruit && (
          <>
            <Tomato x={120} y={186} scale={0.95} ripe={ripe} />
            <Tomato x={156} y={206} scale={0.85} ripe={ripe} />
            <Tomato x={188} y={176} scale={0.9} ripe={ripe} />
            <Tomato x={150} y={150} scale={0.55} ripe={false} />
          </>
        )}
      </g>
    </svg>
  );
}
