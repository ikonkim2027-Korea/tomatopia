import { useGame } from '../state/store';
import { limitingFactor } from '../sim/model';
import { STAGE_LABEL, plantLook } from '../sim/stages';
import { FACTOR_LABEL } from '../content/messages';

function healthColor(h: number) {
  if (h >= 60) return 'var(--good)';
  if (h >= 30) return 'var(--warn)';
  return 'var(--bad)';
}

export default function StatusPanel() {
  const env = useGame((s) => s.env);
  const plant = useGame((s) => s.plant);
  const look = plantLook(env, plant);

  const lim = limitingFactor(env);
  const showTip = plant.alive && plant.growth < 100 && lim.value < 0.95;

  return (
    <div className="panel">
      <h2>Plant Health</h2>

      <div className="stat-row">
        <span className="stat-label">Stage</span>
        <strong>{STAGE_LABEL[look.stage]}</strong>
      </div>

      <div style={{ marginTop: 10 }}>
        <span className="stat-label">Health</span>
        <div className="meter" role="meter" aria-valuenow={Math.round(plant.health)} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${plant.health}%`, background: healthColor(plant.health) }} />
        </div>
      </div>

      <div className="stat-row">
        <span className="stat-label">Growth</span>
        <span>{Math.round(plant.growth)}%</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">Plant age</span>
        <span>{Math.floor(plant.ageDays)} days</span>
      </div>

      {showTip && (
        <div className="hint" style={{ marginTop: 12 }}>
          🔎 Growth is slowed most by <b>{FACTOR_LABEL[lim.key]}</b> right now. A plant grows
          only as well as its <i>weakest</i> condition.
        </div>
      )}
      {plant.growth >= 100 && plant.alive && (
        <div className="hint" style={{ marginTop: 12, borderColor: 'var(--good)', background: '#eef6ea' }}>
          🍅 Fully grown! Your tomato is ripe.
        </div>
      )}
    </div>
  );
}
