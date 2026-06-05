'use client';
import { Site, Collected } from '../lib/heritage';

export default function HeritageArtifactLog({ sites, collected }: { sites: Site[]; collected: Collected[] }) {
  const got = new Set(collected.map((c) => c.siteId));
  return (
    <div className="sl-panel sl-panel-heritage">
      <h3 className="sl-h1 sl-h1-heritage" style={{ fontSize: 16 }}>📔 과학 유물 도감 · {got.size}/{sites.length}</h3>
      <div className="sl-artifact-grid">
        {sites.map((s) => {
          const has = got.has(s.id);
          return (
            <div key={s.id} className={`sl-artifact ${has ? 'has' : 'empty'}`}>
              <div className="sl-artifact-locked" style={{ opacity: has ? 1 : 0.25 }}>{s.artifact.emoji}</div>
              <div className="sl-artifact-label">{has ? s.artifact.name : `🔒 ${s.name}`}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
