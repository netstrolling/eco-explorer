'use client';
import { Site, Collected } from '../lib/heritage';

export default function HeritageArtifactLog({ sites, collected }: { sites: Site[]; collected: Collected[] }) {
  const byId = new Map(collected.map((c) => [c.siteId, c]));
  // 퀴즈 유물을 받은(name 존재) 곳을 '수집'으로 카운트
  const gotCount = sites.filter((s) => byId.get(s.id)?.name).length;
  return (
    <div className="sl-panel sl-panel-heritage">
      <h3 className="sl-h1 sl-h1-heritage" style={{ fontSize: 16 }}>📔 과학 유물 도감 · {gotCount}/{sites.length}</h3>
      <div className="sl-artifact-grid">
        {sites.map((s) => {
          const c = byId.get(s.id);
          const hasArtifact = !!c?.name;
          return (
            <div key={s.id} className={`sl-artifact ${hasArtifact || c?.photoUrl ? 'has' : 'empty'}`}>
              {c?.photoUrl ? (
                <img src={c.photoUrl} alt={s.name} />
              ) : (
                <div className="sl-artifact-locked" style={{ opacity: hasArtifact ? 1 : 0.25 }}>{s.artifact.emoji}</div>
              )}
              <div className="sl-artifact-label">
                {hasArtifact ? s.artifact.name : c?.photoUrl ? s.name : `🔒 ${s.name}`}{c?.photoUrl ? ' 📸' : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
