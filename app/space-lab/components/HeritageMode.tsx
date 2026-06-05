'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LatLng, formatMeters } from '../lib/geo';
import {
  Site, loadSites, saveSites, resetSites, emptySite, loadCollected, collect, collectPhoto, Collected,
  distanceTo, inRange,
} from '../lib/heritage';
import { useGeolocation } from '../hooks/useGeolocation';
import HeritageMap from './HeritageMap';
import HeritageMission from './HeritageMission';
import HeritageSiteEditor from './HeritageSiteEditor';
import HeritageArtifactLog from './HeritageArtifactLog';
import TimeWarpCamera from './TimeWarpCamera';

const HERITAGE_BG = 'radial-gradient(circle at 50% 0%, #2a2418 0%, #14110b 55%, #0a0805 100%)';

export default function HeritageMode({ onBgChange }: { onBgChange: (bg: string) => void }) {
  const [sites, setSites] = useState<Site[]>([]);
  const [collected, setCollected] = useState<Collected[]>([]);
  const [missionSite, setMissionSite] = useState<Site | null>(null);
  const [camSite, setCamSite] = useState<Site | null>(null);
  const [editor, setEditor] = useState<{ site: Site; isNew: boolean } | null>(null);
  const prompted = useRef<Set<string>>(new Set());

  // 출발 위치: 첫 유적 근처(서울역) 기준
  const { pos, mode, setMode, setSimPos, accuracy, error } = useGeolocation([37.5565, 126.9760]);

  useEffect(() => { onBgChange(HERITAGE_BG); }, [onBgChange]);
  useEffect(() => { setSites(loadSites()); setCollected(loadCollected()); }, []);

  // '완료'는 퀴즈 유물(name)을 받은 경우만. 인증샷만 찍은 건 완료가 아님.
  const doneIds = useMemo(() => new Set(collected.filter((c) => c.name).map((c) => c.siteId)), [collected]);

  // Geofencing: 새로 반경 진입 + 미완료 → 미션 자동 팝업 (1회)
  useEffect(() => {
    if (!pos || missionSite || editor) return;
    const hit = sites.find((s) => inRange(s, pos) && !doneIds.has(s.id) && !prompted.current.has(s.id));
    if (hit) { prompted.current.add(hit.id); setMissionSite(hit); }
  }, [pos, sites, doneIds, missionSite, editor]);

  const onSuccess = (s: Site) => {
    collect({ siteId: s.id, name: s.artifact.name, emoji: s.artifact.emoji });
    setCollected(loadCollected());
  };
  const openSite = (s: Site) => {
    if (inRange(s, pos)) setMissionSite(s);
    else setMissionSite(s); // 범위 밖이어도 설명은 볼 수 있게(미션 제출은 동일). 테스트 편의.
  };
  const saveSite = (s: Site) => {
    setSites((prev) => {
      const exists = prev.some((x) => x.id === s.id);
      const next = exists ? prev.map((x) => (x.id === s.id ? s : x)) : [...prev, s];
      saveSites(next); return next;
    });
    setEditor(null);
  };
  const deleteSite = (id: string) => {
    setSites((prev) => { const next = prev.filter((x) => x.id !== id); saveSites(next); return next; });
    setEditor(null);
  };

  const sorted = [...sites].sort((a, b) => {
    if (!pos) return 0;
    return distanceTo(a, pos) - distanceTo(b, pos);
  });

  return (
    <>
      <div className="sl-panel sl-panel-heritage" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <strong className="sl-h1-heritage">🏛️ K-Science Heritage</strong>
          <div style={{ color: '#bba980', fontSize: 12 }}>조선·근대 과학사 유적 탐사 · 수집 {doneIds.size}/{sites.length}</div>
        </div>
        <div className="sl-seg sl-seg-heritage">
          <button className={mode === 'sim' ? 'active' : ''} onClick={() => setMode('sim')}>🧪 시뮬</button>
          <button className={mode === 'live' ? 'active' : ''} onClick={() => setMode('live')}>📡 GPS</button>
        </div>
      </div>

      {error && <div className="sl-statusbar" style={{ color: '#ff9b9b' }}>{error}</div>}

      <div className="sl-panel sl-panel-heritage">
        <HeritageMap sites={sites} pos={pos} canSim={mode === 'sim'} onSimMove={setSimPos} onSiteClick={openSite} />
        <p className="sl-hint" style={{ color: '#bba980' }}>
          {mode === 'sim'
            ? '🧪 지도를 클릭해 이동하세요. 유적 반경(노란 원) 30m 안에 들면 미션이 자동으로 열립니다.'
            : `📡 실시간 GPS${accuracy ? ` (±${Math.round(accuracy)}m)` : ''} — 유적 30m 이내 접근 시 미션 활성화.`}
        </p>
      </div>

      {/* 유적 리스트 + CRUD */}
      <div className="sl-panel sl-panel-heritage">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 className="sl-h1 sl-h1-heritage" style={{ fontSize: 16, margin: 0 }}>🗺️ 탐사 포인트</h3>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="sl-btn" onClick={() => setEditor({ site: emptySite(), isNew: true })}>＋ 추가</button>
            <button className="sl-btn" title="기본값 복원" onClick={() => { const s = resetSites(); setSites(s); }}>↺</button>
          </div>
        </div>
        {sorted.map((s) => {
          const d = pos ? distanceTo(s, pos) : null;
          const near = inRange(s, pos);
          const done = doneIds.has(s.id);
          return (
            <div key={s.id} className={`sl-her-row ${near ? 'near' : ''}`}>
              <span className="em">{s.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="nm">{s.name} {done && '✅'}</div>
                <div className="meta">{s.era} · {s.theme}{d !== null && ` · ${formatMeters(d)}`}{near && ' · 🎯 범위 안'}</div>
              </div>
              <button className={`sl-btn ${near && !done ? 'primary' : ''}`} style={{ padding: '8px 12px' }} onClick={() => openSite(s)}>
                {done ? '완료' : '미션'}
              </button>
              <button className="sl-btn" style={{ padding: '8px 10px' }} title="Time Warp 인증샷" onClick={() => setCamSite(s)}>📸</button>
              <button className="sl-btn" style={{ padding: '8px 10px' }} onClick={() => setEditor({ site: s, isNew: false })}>✎</button>
            </div>
          );
        })}
      </div>

      <HeritageArtifactLog sites={sites} collected={collected} />

      {missionSite && (
        <HeritageMission site={missionSite} alreadyDone={doneIds.has(missionSite.id)} onSuccess={onSuccess} onClose={() => setMissionSite(null)} />
      )}
      {editor && (
        <HeritageSiteEditor initial={editor.site} isNew={editor.isNew} onSave={saveSite} onCancel={() => setEditor(null)} onDelete={editor.isNew ? undefined : deleteSite} />
      )}
      {camSite && (
        <TimeWarpCamera site={camSite} onClose={() => setCamSite(null)} onCapture={(url) => { collectPhoto(camSite.id, url); setCollected(loadCollected()); }} />
      )}
    </>
  );
}
