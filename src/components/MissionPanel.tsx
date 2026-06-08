import { useState } from 'react';
import { useGame } from '../state/store';
import { MISSIONS } from '../content/missions';

export default function MissionPanel() {
  const mode = useGame((s) => s.mode);
  const missionId = useGame((s) => s.missionId);
  const completed = useGame((s) => s.completedMissions);
  const isUnlocked = useGame((s) => s.isUnlocked);
  const selectMission = useGame((s) => s.selectMission);
  const setMode = useGame((s) => s.setMode);
  const current = useGame((s) => s.currentMission());
  const [showNote, setShowNote] = useState(false);

  return (
    <div className="panel">
      <h2>Missions</h2>
      <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', margin: '0 0 10px' }}>
        Grow one tomato through its whole life. Each step unlocks the next. 🔒
      </p>
      <ul className="mission-list">
        {MISSIONS.map((m) => {
          const done = completed.includes(m.id);
          const unlocked = isUnlocked(m.id);
          const active = mode === 'mission' && m.id === missionId;
          const mark = done ? '✓' : unlocked ? '○' : '🔒';
          return (
            <li key={m.id}>
              <button
                className={active ? 'active' : ''}
                disabled={!unlocked}
                title={unlocked ? '' : 'Complete the previous step to unlock'}
                onClick={() => selectMission(m.id)}
              >
                <span className="check" aria-hidden>{mark}</span>
                <span>{m.title}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <button
        className={`btn toggle${mode === 'sandbox' ? ' on' : ''}`}
        style={{ width: '100%' }}
        onClick={() => setMode(mode === 'sandbox' ? 'mission' : 'sandbox')}
      >
        🧪 {mode === 'sandbox' ? 'Back to Missions' : 'Free Play (no missions)'}
      </button>

      <div style={{ marginTop: 14 }}>
        {mode === 'mission' ? (
          <>
            <p className="mission-goal"><strong>Goal:</strong> {current.goal}</p>
            <div className="hint">💡 {current.hint}</div>
            <button className="note-toggle" onClick={() => setShowNote((v) => !v)}>
              {showNote ? 'Hide' : 'Show'} Scientist&apos;s Note 🔬
            </button>
            {showNote && <div className="note">{current.scientistNote}</div>}
          </>
        ) : (
          <p className="mission-goal">
            🧪 <strong>Free play:</strong> grow, pollinate, and harvest as many tomatoes as you like.
            Try to beat your best score!
          </p>
        )}
      </div>
    </div>
  );
}
