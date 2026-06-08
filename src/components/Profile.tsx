import { useState } from 'react';
import { useGame } from '../state/store';
import { MISSIONS } from '../content/missions';
import { GRADE_LABEL } from '../content/messages';
import { hasBackend } from '../state/persistence';

export default function Profile() {
  const nickname = useGame((s) => s.nickname);
  const setNickname = useGame((s) => s.setNickname);
  const totalScore = useGame((s) => s.totalScore);
  const harvests = useGame((s) => s.harvests);
  const completed = useGame((s) => s.completedMissions);
  const compostCredit = useGame((s) => s.compostCredit);
  const resetProgress = useGame((s) => s.resetProgress);

  const [name, setName] = useState(nickname);
  const best = harvests.reduce((m, h) => (h.score > m ? h.score : m), 0);
  const goodHarvests = harvests.filter((h) => h.score > 0).length;

  return (
    <div className="panel" style={{ maxWidth: 620, margin: '0 auto' }}>
      <h2>👤 Gardener Profile</h2>

      <label className="stat-label" htmlFor="nick">Nickname</label>
      <div style={{ display: 'flex', gap: 8, margin: '6px 0 16px' }}>
        <input id="nick" className="field" value={name} maxLength={20} onChange={(e) => setName(e.target.value)} />
        <button className="btn primary" onClick={() => name.trim() && setNickname(name.trim())}>Save</button>
      </div>

      <div className="cards-grid">
        <div className="stat-card"><div className="big-num">{totalScore}</div><div>Total points</div></div>
        <div className="stat-card"><div className="big-num">{goodHarvests}</div><div>Tomatoes harvested</div></div>
        <div className="stat-card"><div className="big-num">{best}</div><div>Best single harvest</div></div>
        <div className="stat-card"><div className="big-num">{completed.length}/{MISSIONS.length}</div><div>Missions done</div></div>
        <div className="stat-card"><div className="big-num">{compostCredit}</div><div>Compost made ♻️</div></div>
      </div>

      <h3 style={{ marginTop: 18 }}>Recent harvests</h3>
      {harvests.length === 0 ? (
        <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>No harvests yet. Grow and pick a ripe tomato!</p>
      ) : (
        <table className="board">
          <thead><tr><th>Day</th><th>Weight</th><th>Quality</th><th>Points</th></tr></thead>
          <tbody>
            {harvests.slice(0, 8).map((h, i) => (
              <tr key={i}>
                <td>Day {h.day}</td>
                <td>{(h.weightG / 1000).toFixed(2)} kg</td>
                <td>{GRADE_LABEL[h.grade]}</td>
                <td><strong>{h.score}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="note" style={{ marginTop: 16 }}>
        💾 <b>Where is my progress saved?</b> Automatically, right here in your web browser
        (no account, no password, no personal info). {hasBackend
          ? 'A backend is connected, so your garden also syncs online.'
          : 'It stays on this device. A teacher can connect the optional backend for class saves.'}
      </div>

      <button
        className="btn"
        style={{ marginTop: 14, color: 'var(--bad)' }}
        onClick={() => {
          if (confirm('Reset all progress, score, and harvests?')) resetProgress();
        }}
      >
        ♻️ Reset my progress
      </button>
    </div>
  );
}
