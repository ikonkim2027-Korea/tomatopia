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
  const isLocked = useGame((s) => s.isLocked);

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
          locked={isLocked(m.key)}
          onChange={(v) => setControl(m.key, v)}
        />
      ))}
    </div>
  );
}
