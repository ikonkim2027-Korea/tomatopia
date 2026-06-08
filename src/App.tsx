import { useEffect, useState } from 'react';
import { useGame, TICK_MS, type View } from './state/store';
import { missionById } from './content/missions';
import { GRADE_LABEL, GRADE_MESSAGE } from './content/messages';
import Scene from './art/Scene';
import ControlPanel from './components/ControlPanel';
import StatusPanel from './components/StatusPanel';
import MissionPanel from './components/MissionPanel';
import Profile from './components/Profile';
import Leaderboard from './components/Leaderboard';

const TABS: { id: View; label: string }[] = [
  { id: 'greenhouse', label: '🌱 Greenhouse' },
  { id: 'profile', label: '👤 Profile' },
  { id: 'leaderboard', label: '🏆 Leaderboard' },
];

function Header() {
  const view = useGame((s) => s.view);
  const setView = useGame((s) => s.setView);
  const totalScore = useGame((s) => s.totalScore);
  return (
    <div className="topbar">
      <h1 className="brand">🍅 Tomatopia</h1>
      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={`tab${view === t.id ? ' active' : ''}`} onClick={() => setView(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
      <div className="spacer" />
      <div className="score-chip">⭐ {totalScore} pts</div>
    </div>
  );
}

function GreenhouseControls() {
  const running = useGame((s) => s.running);
  const speed = useGame((s) => s.speed);
  const plant = useGame((s) => s.plant);
  const togglePlay = useGame((s) => s.togglePlay);
  const setSpeed = useGame((s) => s.setSpeed);
  const replant = useGame((s) => s.replant);
  return (
    <div className="subbar">
      <button className="btn icon" onClick={togglePlay}>{running ? '⏸ Pause' : '▶ Play'}</button>
      <button className={`btn icon toggle${speed > 1 ? ' on' : ''}`} onClick={() => setSpeed(speed > 1 ? 1 : 3)}>
        {speed > 1 ? '⏩ Fast' : '🐢 1×'}
      </button>
      <button className="btn icon" onClick={replant} disabled={plant.growth === 0 && plant.alive}>🌱 Replant</button>
    </div>
  );
}

function Celebration() {
  const justCompleted = useGame((s) => s.justCompleted);
  const dismiss = useGame((s) => s.dismissCompleted);
  if (!justCompleted) return null;
  const m = missionById(justCompleted);
  return (
    <div className="overlay" onClick={dismiss}>
      <div className="celebrate" onClick={(e) => e.stopPropagation()}>
        <div className="big">🎉🌱</div>
        <h2>Step Complete!</h2>
        <p>{m.successText}</p>
        <button className="btn primary" style={{ marginTop: 16 }} onClick={dismiss}>Keep growing →</button>
      </div>
    </div>
  );
}

function HarvestModal() {
  const last = useGame((s) => s.lastHarvest);
  const dismiss = useGame((s) => s.dismissHarvest);
  if (!last) return null;
  return (
    <div className="overlay" onClick={dismiss}>
      <div className="celebrate" onClick={(e) => e.stopPropagation()} style={{ borderColor: last.composted ? '#9a7a4e' : 'var(--leaf)' }}>
        <div className="big">{last.composted ? '♻️' : '🧺🍅'}</div>
        <h2 style={{ color: last.composted ? '#7a5a33' : 'var(--leaf-dark)' }}>
          {last.composted ? 'Composted!' : 'Harvest!'}
        </h2>
        <p style={{ fontSize: 16 }}>
          <strong>{(last.weightG / 1000).toFixed(2)} kg</strong> · {GRADE_LABEL[last.grade]}
        </p>
        <p style={{ fontSize: 28, margin: '4px 0', color: 'var(--tomato-dark)' }}>+{last.score} pts</p>
        <p>{GRADE_MESSAGE[last.grade]}</p>
        <button className="btn primary" style={{ marginTop: 14 }} onClick={dismiss}>Plant another 🌱</button>
      </div>
    </div>
  );
}

function NicknameGate() {
  const nickname = useGame((s) => s.nickname);
  const setNickname = useGame((s) => s.setNickname);
  const [val, setVal] = useState('');
  if (nickname) return null;
  const begin = () => {
    if (!val.trim()) return;
    setNickname(val.trim());
    useGame.setState({ running: true });
  };
  return (
    <div className="overlay">
      <div className="celebrate" style={{ borderColor: 'var(--tomato)' }}>
        <div className="big">🍅</div>
        <h2 style={{ color: 'var(--tomato-dark)' }}>Welcome to Tomatopia!</h2>
        <p>Pick a gardener nickname to begin. (No real names needed!)</p>
        <input
          className="field"
          style={{ marginTop: 12 }}
          placeholder="e.g. SunnyGardener"
          maxLength={20}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && begin()}
        />
        <button className="btn primary" style={{ marginTop: 14 }} disabled={!val.trim()} onClick={begin}>
          Start growing 🌱
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const tick = useGame((s) => s.tick);
  const view = useGame((s) => s.view);
  const nickname = useGame((s) => s.nickname);

  useEffect(() => {
    const id = setInterval(() => tick(), TICK_MS);
    return () => clearInterval(id);
  }, [tick]);

  return (
    <div className="app">
      <Header />

      {view === 'greenhouse' && (
        <>
          <GreenhouseControls />
          <div className="layout">
            <div className="col-controls"><ControlPanel /></div>
            <div className="col-scene"><Scene /></div>
            <div className="col-side">
              <MissionPanel />
              <StatusPanel />
            </div>
          </div>
        </>
      )}
      {view === 'profile' && <Profile />}
      {view === 'leaderboard' && <Leaderboard />}

      <p className="footer-note">
        Tomatopia · a science sim for young gardeners{nickname ? ` · Gardener: ${nickname}` : ''}
      </p>

      <Celebration />
      <HarvestModal />
      <NicknameGate />
    </div>
  );
}
