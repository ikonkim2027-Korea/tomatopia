import { useGame } from '../state/store';
import { FACTORS, type FactorKey } from '../sim/model';
import SliderControl from './SliderControl';

const META: { key: FactorKey; icon: string; name: string; unit: string }[] = [
  { key: 'light', icon: '☀️', name: 'Sunlight', unit: ' h' },
  { key: 'water', icon: '💧', name: 'Water', unit: '%' },
  { key: 'temperature', icon: '🌡️', name: 'Temperature', unit: '°C' },
  { key: 'nutrients', icon: '🌿', name: 'Nutrients', unit: '%' },
];

export default function ControlPanel() {
  const env = useGame((s) => s.env);
  const setControl = useGame((s) => s.setControl);

  return (
    <div className="panel">
      <h2>Greenhouse Controls</h2>
      {META.map((m) => (
        <SliderControl
          key={m.key}
          factorKey={m.key}
          icon={m.icon}
          name={m.name}
          unit={m.unit}
          value={env[m.key]}
          config={FACTORS[m.key]}
          locked={false}
          onChange={(v) => setControl(m.key, v)}
        />
      ))}
      <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '4px 2px 0' }}>
        The green band on each slider is the tomato's <b>ideal</b> range.
      </p>
    </div>
  );
}
