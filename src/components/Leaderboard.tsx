import { useGame } from '../state/store';
import { buildLeaderboard } from '../content/leaderboard';
import { GRADE_LABEL } from '../content/messages';

export default function Leaderboard() {
  const nickname = useGame((s) => s.nickname);
  const harvests = useGame((s) => s.harvests);
  const rows = buildLeaderboard(nickname, harvests);

  return (
    <div className="panel" style={{ maxWidth: 620, margin: '0 auto' }}>
      <h2>🏆 Leaderboard</h2>
      <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: -4 }}>
        Heaviest harvests win. <b>1&nbsp;kg = 10 points</b> (100&nbsp;g = 1 point). Scores are
        saved in this browser.
      </p>
      <table className="board">
        <thead>
          <tr><th>#</th><th>Gardener</th><th>Weight</th><th>Quality</th><th>Score</th></tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={r.you ? 'you' : ''}>
              <td>{i + 1}</td>
              <td>{r.nickname}{r.you ? ' (you)' : ''}</td>
              <td>{(r.weightG / 1000).toFixed(2)} kg</td>
              <td>{GRADE_LABEL[r.grade]}</td>
              <td><strong>{r.score}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
      {harvests.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
          You haven&apos;t harvested yet — grow a ripe tomato and harvest it to get on the board!
        </p>
      )}
    </div>
  );
}
