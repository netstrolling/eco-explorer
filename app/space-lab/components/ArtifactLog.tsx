'use client';
import { Artifact, removeArtifact } from '../lib/artifacts';
import { PLANETS, PLANET_EN } from '../lib/solar';
import { useI18n } from '../lib/i18n';

// 미션 보유 행성 수 = 도감 총 칸 수
const MISSION_PLANETS = PLANETS.filter((p) => p.mission);

export default function ArtifactLog({ artifacts, onChange }: { artifacts: Artifact[]; onChange: () => void }) {
  const { t } = useI18n();
  const byPlanet = new Map<string, Artifact>();
  for (const a of artifacts) if (!byPlanet.has(a.planetKey)) byPlanet.set(a.planetKey, a);
  const collected = byPlanet.size;

  return (
    <div className="sl-panel">
      <h3 className="sl-h1" style={{ fontSize: 16 }}>📔 {t({ ko: '도감 (Artifact Log)', en: 'Artifact Log' })} · {collected}/{MISSION_PLANETS.length}</h3>
      <div className="sl-artifact-grid">
        {MISSION_PLANETS.map((p) => {
          const a = byPlanet.get(p.key);
          const name = t({ ko: p.name, en: PLANET_EN[p.key]?.name ?? p.name });
          return (
            <div key={p.key} className={`sl-artifact ${a ? 'has' : 'empty'}`}>
              {a ? (
                <>
                  <img src={a.dataUrl} alt={name} />
                  <button className="sl-artifact-x" onClick={() => { removeArtifact(a.id); onChange(); }} title={t({ ko: '삭제', en: 'Delete' })}>✕</button>
                </>
              ) : (
                <div className="sl-artifact-locked">{p.emoji}</div>
              )}
              <div className="sl-artifact-label">{p.emoji} {name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
