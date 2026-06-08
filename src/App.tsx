import { useEffect, useState } from 'react';
import { useGame, TICK_MS } from './state/store';
import { missionById } from './content/missions';
import Scene from './art/Scene';
import ControlPanel from './components/ControlPanel';
import StatusPanel from './components/StatusPanel';
import MissionPanel from './components/MissionPanel';

function Toolbar() {
  const running = useGame((s) => s.running);
  const speed = useGame((s) => s.speed);
  const plant = useGame((s) => s.plant);
  const togglePlay = useGame((s) => s.togglePlay);
  const setSpeed = useGame((s) => s.setSpeed);
  const replant = useGame((s) => s.replant);

  return (
    <div className="topbar">
      <h1 className="brand">🍅 Tomatopia <small>grow a tomato with science</small></h1>
      <div className="spacer" />
      <button className="btn icon" onClick={togglePlay} aria-label={running ? 'Pause' : 'Play'}>
        {running ? '⏸ Pause' : '▶ Play'}
      </button>
      <button
        className={`btn icon toggle${speed > 1 ? ' on' : ''}`}
        onClick={() => setSpeed(speed > 1 ? 1 : 3)}
        aria-label="Toggle speed"
      >
        {speed > 1 ? '⏩ Fast' : '🐢 1×'}
      </button>
      <button className="btn icon" onClick={replant} disabled={plant.growth === 0 && plant.alive}>
        🌱 Replant
      </button>
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
        <div className="big">🎉🍅</div>
        <h2>Mission Complete!</h2>
        <p>{m.successText}</p>
        <button className="btn primary" style={{ marginTop: 16 }} onClick={dismiss}>
          Keep going →
        </button>
      </div>
    </div>
  );
}

function NicknameGate() {
  const nickname = useGame((s) => s.nickname);
  const setNickname = useGame((s) => s.setNickname);
  const selectMission = useGame((s) => s.selectMission);
  const missionId = useGame((s) => s.missionId);
  const [val, setVal] = useState('');
  if (nickname) return null;
  const begin = () => {
    if (!val.trim()) return;
    setNickname(val.trim());
    selectMission(missionId);
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
  const nickname = useGame((s) => s.nickname);

  useEffect(() => {
    const id = setInterval(() => tick(), TICK_MS);
    return () => clearInterval(id);
  }, [tick]);

  return (
    <div className="app">
      <Toolbar />
      <div className="layout">
        <div className="col-controls"><ControlPanel /></div>
        <div className="col-scene">
          <Scene />
        </div>
        <div className="col-side">
          <MissionPanel />
          <StatusPanel />
        </div>
      </div>
      <p className="footer-note">
        Tomatopia · a science sim for young gardeners{nickname ? ` · Gardener: ${nickname}` : ''}
      </p>
      <Celebration />
      <NicknameGate />
    </div>
  );
}
