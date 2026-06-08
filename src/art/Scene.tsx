import { useGame } from '../state/store';
import { feedback } from '../content/messages';
import { STAGE_LABEL, plantLook } from '../sim/stages';
import Plant from './Plant';

/** Cozy greenhouse backdrop, aligned to the same 320x330 viewBox as the plant. */
function Backdrop() {
  return (
    <svg viewBox="0 0 320 330" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }} aria-hidden>
      <defs>
        <radialGradient id="sun" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff0b8" /><stop offset="0.6" stopColor="#f4c64e" /><stop offset="1" stopColor="#f0b93a" />
        </radialGradient>
        <linearGradient id="bench" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b07f4e" /><stop offset="1" stopColor="#8f6238" />
        </linearGradient>
      </defs>
      {/* sun + rays */}
      <g transform="translate(268 44)">
        <g stroke="#f6cf63" strokeWidth="4" strokeLinecap="round" opacity="0.8">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <line key={a} x1="0" y1="-30" x2="0" y2="-40" transform={`rotate(${a})`} />
          ))}
        </g>
        <circle r="22" fill="url(#sun)" />
      </g>
      {/* clouds */}
      <g fill="#ffffff" opacity="0.85">
        <ellipse cx="70" cy="56" rx="26" ry="14" />
        <ellipse cx="92" cy="50" rx="20" ry="12" />
        <ellipse cx="150" cy="34" rx="22" ry="12" />
      </g>
      {/* faint greenhouse window mullions */}
      <g stroke="#bfe0d2" strokeWidth="3" opacity="0.4">
        <line x1="40" y1="0" x2="40" y2="300" />
        <line x1="160" y1="0" x2="160" y2="300" />
        <line x1="280" y1="0" x2="280" y2="300" />
        <line x1="0" y1="120" x2="320" y2="120" />
      </g>
      {/* wooden bench / ground */}
      <rect x="0" y="298" width="320" height="32" fill="url(#bench)" />
      <rect x="0" y="298" width="320" height="5" fill="#c08d57" />
    </svg>
  );
}

export default function Scene() {
  const env = useGame((s) => s.env);
  const plant = useGame((s) => s.plant);
  const look = plantLook(env, plant);
  const fb = feedback(look, plant);

  return (
    <div className="scene-wrap">
      <div className="scene-canvas">
        <Backdrop />
        {/* the plant itself */}
        <div className="plant" style={{ position: 'absolute', inset: 0 }}>
          <Plant stage={look.stage} mood={look.mood} />
        </div>

        <div className="day-badge">📅 Day {Math.floor(plant.ageDays)}</div>
        <div className="stage-badge">{STAGE_LABEL[look.stage]}</div>
        <div className={`bubble ${fb.tone}`}>{fb.text}</div>
      </div>
    </div>
  );
}
