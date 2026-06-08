import { useGame } from '../state/store';
import { limitingFactor } from '../sim/model';
import { PHASE_LABEL, plantLook } from '../sim/stages';
import { FACTOR_LABEL } from '../content/messages';

function healthColor(h: number) {
  if (h >= 60) return 'var(--good)';
  if (h >= 30) return 'var(--warn)';
  return 'var(--bad)';
}

export default function StatusPanel() {
  const env = useGame((s) => s.env);
  const plant = useGame((s) => s.plant);
  const totalScore = useGame((s) => s.totalScore);
  const look = plantLook(env, plant);

  const lim = limitingFactor(env);
  const showTip = plant.alive && plant.growth < 100 && lim.value < 0.95 && plant.growth >= 4;
  const showRipeness = look.fruitColor !== 'none';

  return (
    <div className="panel">
      <h2>Plant Health</h2>

      <div className="stat-row">
        <span className="stat-label">Stage</span>
        <strong>{PHASE_LABEL[look.phase]}</strong>
      </div>

      <div style={{ marginTop: 10 }}>
        <span className="stat-label">Health</span>
        <div className="meter" role="meter" aria-valuenow={Math.round(plant.health)} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${plant.health}%`, background: healthColor(plant.health) }} />
        </div>
      </div>

      {showRipeness && (
        <div style={{ marginTop: 8 }}>
          <span className="stat-label">Ripeness</span>
          <div className="meter" role="meter" aria-valuenow={Math.round(plant.ripeness)} aria-valuemin={0} aria-valuemax={100}>
            <span
              style={{
                width: `${plant.ripeness}%`,
                background: plant.rotted ? '#7a5a33' : 'linear-gradient(90deg,#7cc04f,#f59331,#ef4f2c)',
              }}
            />
          </div>
        </div>
      )}

      <div className="stat-row" style={{ marginTop: 8 }}>
        <span className="stat-label">Growth</span>
        <span>{Math.round(plant.growth)}%</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">Plant age</span>
        <span>{Math.floor(plant.ageDays)} days</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">Total score</span>
        <strong style={{ color: 'var(--tomato-dark)' }}>{totalScore} pts</strong>
      </div>

      {showTip && (
        <div className="hint" style={{ marginTop: 12 }}>
          🔎 Growth is slowed most by <b>{FACTOR_LABEL[lim.key]}</b> right now. A plant grows
          only as well as its <i>weakest</i> condition.
        </div>
      )}
    </div>
  );
}
