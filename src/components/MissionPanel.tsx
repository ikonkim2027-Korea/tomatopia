import { useState } from 'react';
import { useGame } from '../state/store';
import { MISSIONS } from '../content/missions';

export default function MissionPanel() {
  const mode = useGame((s) => s.mode);
  const missionId = useGame((s) => s.missionId);
  const completed = useGame((s) => s.completedMissions);
  const selectMission = useGame((s) => s.selectMission);
  const startSandbox = useGame((s) => s.startSandbox);
  const current = useGame((s) => s.currentMission());
  const [showNote, setShowNote] = useState(false);

  return (
    <div className="panel">
      <h2>Missions</h2>
      <ul className="mission-list">
        {MISSIONS.map((m) => {
          const done = completed.includes(m.id);
          const active = mode === 'mission' && m.id === missionId;
          return (
            <li key={m.id}>
              <button className={active ? 'active' : ''} onClick={() => selectMission(m.id)}>
                <span className="check" aria-hidden>{done ? '✓' : '○'}</span>
                <span>{m.title}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <button className={`btn toggle${mode === 'sandbox' ? ' on' : ''}`} style={{ width: '100%' }} onClick={startSandbox}>
        🧪 Free Greenhouse (Sandbox)
      </button>

      <div style={{ marginTop: 14 }}>
        <p className="mission-goal"><strong>Goal:</strong> {current.goal}</p>
        {mode === 'mission' && <div className="hint">💡 {current.hint}</div>}
        <button className="note-toggle" onClick={() => setShowNote((v) => !v)}>
          {showNote ? 'Hide' : 'Show'} Scientist&apos;s Note 🔬
        </button>
        {showNote && <div className="note">{current.scientistNote}</div>}
      </div>
    </div>
  );
}
