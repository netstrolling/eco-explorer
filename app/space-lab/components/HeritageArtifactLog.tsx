'use client';
import { useState } from 'react';
import { Site, Collected } from '../lib/heritage';

export default function HeritageArtifactLog({ sites, collected }: { sites: Site[]; collected: Collected[] }) {
  const byId = new Map(collected.map((c) => [c.siteId, c]));
  const gotCount = sites.filter((s) => byId.get(s.id)?.name).length;
  const [zoom, setZoom] = useState<{ url: string; title: string } | null>(null);

  return (
    <div className="sl-panel sl-panel-heritage">
      <h3 className="sl-h1 sl-h1-heritage" style={{ fontSize: 16 }}>📔 과학 유물 도감 · {gotCount}/{sites.length}</h3>
      <div className="sl-artifact-grid">
        {sites.map((s) => {
          const c = byId.get(s.id);
          const hasArtifact = !!c?.name;
          return (
            <div key={s.id} className={`sl-artifact ${hasArtifact ? 'has' : 'empty'}`}>
              {/* 메인: 항상 유물 아이콘 (잠금/해금) — 사진이 덮지 않음 */}
              <div className="sl-artifact-locked" style={{ opacity: hasArtifact ? 1 : 0.25 }}>{s.artifact.emoji}</div>
              {/* 인증샷: 모서리 썸네일, 탭하면 크게 */}
              {c?.photoUrl && (
                <button className="sl-artifact-photo" title="Time Warp 인증샷 보기"
                  onClick={() => setZoom({ url: c.photoUrl!, title: s.name })}>
                  <img src={c.photoUrl} alt={`${s.name} 인증샷`} />
                </button>
              )}
              <div className="sl-artifact-label">{hasArtifact ? s.artifact.name : `🔒 ${s.name}`}</div>
            </div>
          );
        })}
      </div>

      {zoom && (
        <div className="sl-modal-backdrop" onClick={() => setZoom(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '92%', textAlign: 'center' }}>
            <img src={zoom.url} alt={zoom.title} style={{ maxWidth: '100%', maxHeight: '78vh', borderRadius: 12, border: '1px solid var(--sl-border)' }} />
            <div style={{ marginTop: 10 }}><button className="sl-btn" onClick={() => setZoom(null)}>닫기</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
