'use client';
import { PLANETS } from '../lib/solar';

// AU는 안쪽 행성으로 갈수록 값이 급격히 작아져(5.2→0) 선형 배치 시 라벨이 겹친다.
// 따라서 행성은 "통과 마일스톤"으로 균등 배치하고, 우주선만 현재 AU로 인접 궤도 사이를 보간한다.
const N = PLANETS.length;
const planetPct = (i: number) => (i / (N - 1)) * 100;

function shipPct(au: number): number {
  // PLANETS는 au 내림차순. 현재 au가 속한 구간을 찾아 선형 보간.
  if (au >= PLANETS[0].au) return 0;
  if (au <= PLANETS[N - 1].au) return 100;
  for (let i = 0; i < N - 1; i++) {
    const hi = PLANETS[i].au;
    const lo = PLANETS[i + 1].au;
    if (au <= hi && au >= lo) {
      const frac = (hi - au) / (hi - lo);
      return planetPct(i + frac);
    }
  }
  return 0;
}

export default function CosmicProgressBar({ shipEmoji, currentAU }: { shipEmoji: string; currentAU: number }) {
  const pct = Math.max(0, Math.min(100, shipPct(currentAU)));

  return (
    <div className="sl-progress-track">
      <div className="sl-progress-fill" style={{ width: `${pct}%` }} />
      {PLANETS.map((p, i) => {
        const passed = p.au >= currentAU; // 현재보다 바깥(au 큼) = 이미 통과
        return (
          <div
            key={p.key}
            className={`sl-planet-dot ${passed ? 'passed' : 'future'}`}
            style={{ left: `${planetPct(i)}%` }}
            title={`${p.name} · ${p.au} AU`}
          >
            {p.emoji}
            <span className="lbl">{p.name}</span>
          </div>
        );
      })}
      <div className="sl-ship" style={{ left: `${pct}%` }}>
        {shipEmoji}
      </div>
    </div>
  );
}
