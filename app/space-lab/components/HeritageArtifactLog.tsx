'use client';
import { useState } from 'react';
import { Site, Collected } from '../lib/heritage';
import { useI18n } from '../lib/i18n';

export default function HeritageArtifactLog({ sites, collected }: { sites: Site[]; collected: Collected[] }) {
  const { t } = useI18n();
  const byId = new Map(collected.map((c) => [c.siteId, c]));
  const gotCount = sites.filter((s) => byId.get(s.id)?.name).length;
  const [zoom, setZoom] = useState<{ url: string; title: string } | null>(null);

  return (
    <div className="sl-panel sl-panel-heritage">
      <h3 className="sl-h1 sl-h1-heritage" style={{ fontSize: 16 }}>📔 {t({ ko: '과학 유물 도감', en: 'Science Artifact Log' })} · {gotCount}/{sites.length}</h3>
      <div className="sl-artifact-grid">
        {sites.map((s) => {
          const c = byId.get(s.id);
          const hasArtifact = !!c?.name;
          return (
            <div key={s.id} className={`sl-artifact ${hasArtifact || c?.photoUrl ? 'has' : 'empty'}`}>
              {c?.photoUrl ? (
                // 인증샷을 칸 전체에 깔고, 유물 아이콘은 모서리 배지로
                <button className="sl-artifact-photobg" title="크게 보기" onClick={() => setZoom({ url: c.photoUrl!, title: s.name })}>
                  <img src={c.photoUrl} alt={`${s.name} 인증샷`} />
                  <span className="sl-artifact-badge" style={{ opacity: hasArtifact ? 1 : 0.5 }}>{hasArtifact ? s.artifact.emoji : '🔒'}</span>
                </button>
              ) : (
                <div className="sl-artifact-locked" style={{ opacity: hasArtifact ? 1 : 0.25 }}>{s.artifact.emoji}</div>
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
            <div style={{ marginTop: 10 }}><button className="sl-btn" onClick={() => setZoom(null)}>{t({ ko: '닫기', en: 'Close' })}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
