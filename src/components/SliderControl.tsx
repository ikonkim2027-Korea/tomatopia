import type { FactorConfig } from '../sim/model';

interface Props {
  factorKey: string;
  icon: string;
  name: string;
  value: number;
  config: FactorConfig;
  unit: string;
  locked: boolean;
  onChange: (v: number) => void;
}

/** A labelled slider with the scientifically-correct "ideal zone" drawn on the track. */
export default function SliderControl({ icon, name, value, config, unit, locked, onChange }: Props) {
  const { uiMin, uiMax, lowOpt, highOpt } = config;
  const span = uiMax - uiMin;
  const bandLeft = ((lowOpt - uiMin) / span) * 100;
  const bandWidth = ((highOpt - lowOpt) / span) * 100;

  return (
    <div className={`control${locked ? ' locked' : ''}`}>
      <div className="control-head">
        <span className="ico" aria-hidden>{icon}</span>
        <span className="name">{name}</span>
        {locked && <span className="lock-tag">auto · just right</span>}
        <span className="val">{Math.round(value)}{unit}</span>
      </div>
      <div className="track">
        <div className="ideal-band" style={{ left: `${bandLeft}%`, width: `${bandWidth}%` }} title="Ideal range" />
        <input
          type="range"
          min={uiMin}
          max={uiMax}
          step={1}
          value={value}
          disabled={locked}
          aria-label={`${name}: ${Math.round(value)}${unit}`}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
    </div>
  );
}
