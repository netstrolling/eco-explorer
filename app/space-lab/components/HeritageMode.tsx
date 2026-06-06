'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatMeters } from '../lib/geo';
import {
  Site, loadSites, saveSites, resetSites, emptySite, loadCollected, collect, collectPhoto, Collected,
  distanceTo, inRange, localizeSite, localizeEra,
  Beacon, BEACONS, loadItems, collectItem, inBeaconRange, localizeBeacon,
} from '../lib/heritage';
import { useI18n } from '../lib/i18n';
import { useGeolocation } from '../hooks/useGeolocation';
import HeritageMap from './HeritageMap';
import HeritageMission from './HeritageMission';
import HeritageSiteEditor from './HeritageSiteEditor';
import HeritageArtifactLog from './HeritageArtifactLog';
import TimeWarpCamera from './TimeWarpCamera';

const HERITAGE_BG = 'radial-gradient(circle at 50% 0%, #2a2418 0%, #14110b 55%, #0a0805 100%)';
const ADMIN_PIN = 'galdar123'; // 관리자 모드 PIN (프로토타입용 — 클라이언트 게이트)

export default function HeritageMode({ onBgChange }: { onBgChange: (bg: string) => void }) {
  const { lang, t } = useI18n();
  const [sites, setSites] = useState<Site[]>([]);
  const [collected, setCollected] = useState<Collected[]>([]);
  const [missionSite, setMissionSite] = useState<Site | null>(null);
  const [camSite, setCamSite] = useState<Site | null>(null);
  const [editor, setEditor] = useState<{ site: Site; isNew: boolean } | null>(null);
  const [admin, setAdmin] = useState(false);
  const [items, setItems] = useState<string[]>([]);
  const [itemToast, setItemToast] = useState<Beacon | null>(null);
  const prompted = useRef<Set<string>>(new Set());
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const L = (s: Site) => localizeSite(s, lang);

  const toggleAdmin = () => {
    if (admin) { setAdmin(false); try { localStorage.removeItem('sl_heritage_admin'); } catch {} return; }
    const pin = window.prompt(t({ ko: '관리자 PIN을 입력하세요', en: 'Enter the admin PIN' }));
    if (pin === null) return;
    if (pin === ADMIN_PIN) { setAdmin(true); try { localStorage.setItem('sl_heritage_admin', '1'); } catch {} }
    else window.alert(t({ ko: 'PIN이 올바르지 않습니다.', en: 'Incorrect PIN.' }));
  };

  const { pos, mode, setMode, setSimPos, accuracy, error } = useGeolocation([37.5565, 126.9760]);

  useEffect(() => { onBgChange(HERITAGE_BG); }, [onBgChange]);
  useEffect(() => {
    setSites(loadSites()); setCollected(loadCollected()); setItems(loadItems());
    try { if (localStorage.getItem('sl_heritage_admin') === '1') setAdmin(true); } catch {}
  }, []);

  // 근접 아이템: 비콘 반경 진입 시 자동 획득 + 토스트(3초)
  useEffect(() => {
    if (!pos) return;
    const hit = BEACONS.find((b) => inBeaconRange(b, pos) && !items.includes(b.id));
    if (hit && collectItem(hit.id)) {
      setItems(loadItems());
      setItemToast(localizeBeacon(hit, lang));
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setItemToast(null), 3500);
    }
  }, [pos, items, lang]);

  const doneIds = useMemo(() => new Set(collected.filter((c) => c.name).map((c) => c.siteId)), [collected]);
  const photoIds = useMemo(() => new Set(collected.filter((c) => c.photoUrl).map((c) => c.siteId)), [collected]);
  const dsites = useMemo(() => sites.map((s) => localizeSite(s, lang)), [sites, lang]);
  const dbeacons = useMemo(() => BEACONS.map((b) => localizeBeacon(b, lang)), [lang]);

  // Geofencing: 새로 반경 진입 + 미완료 → 미션 자동 팝업 (1회)
  useEffect(() => {
    if (!pos || missionSite || editor) return;
    const hit = sites.find((s) => inRange(s, pos) && !doneIds.has(s.id) && !prompted.current.has(s.id));
    if (hit) { prompted.current.add(hit.id); setMissionSite(L(hit)); }
  }, [pos, sites, doneIds, missionSite, editor]); // eslint-disable-line

  const onSuccess = (s: Site) => {
    collect({ siteId: s.id, name: s.artifact.name, emoji: s.artifact.emoji });
    setCollected(loadCollected());
  };
  const openSite = (s: Site) => setMissionSite(L(s)); // 범위 밖이어도 설명 열람 가능(테스트 편의)
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

  // 거리순 정렬한 원본 사이트 (편집은 원본, 표시는 localize)
  const sorted = [...sites].sort((a, b) => (pos ? distanceTo(a, pos) - distanceTo(b, pos) : 0));

  return (
    <>
      <div className="sl-panel sl-panel-heritage" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <strong className="sl-h1-heritage">🏛️ K-Science Heritage</strong>
          <div style={{ color: '#bba980', fontSize: 12 }}>
            {t({ ko: '조선·근대 과학사 유적 탐사', en: 'Joseon & modern science-history quest' })} · {t({ ko: '수집', en: 'Collected' })} {doneIds.size}/{sites.length}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="sl-seg sl-seg-heritage">
            <button className={mode === 'sim' ? 'active' : ''} onClick={() => setMode('sim')}>🧪 {t({ ko: '시뮬', en: 'Sim' })}</button>
            <button className={mode === 'live' ? 'active' : ''} onClick={() => setMode('live')}>📡 GPS</button>
          </div>
          <button className={`sl-btn ${admin ? 'sl-admin-badge' : ''}`} style={{ padding: '8px 10px' }} title={t({ ko: '관리자 모드', en: 'Admin mode' })} onClick={toggleAdmin}>{admin ? `🔧 ${t({ ko: '관리자', en: 'Admin' })}` : '🔧'}</button>
        </div>
      </div>

      {error && <div className="sl-statusbar" style={{ color: '#ff9b9b' }}>{error}</div>}

      {/* 획득 아이템 인벤토리 */}
      <div className="sl-panel sl-panel-heritage" style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <strong className="sl-h1-heritage" style={{ fontSize: 14 }}>🎒 {t({ ko: '획득 아이템', en: 'Items' })} {items.length}/{BEACONS.length}</strong>
          {dbeacons.map((b) => {
            const owned = items.includes(b.id);
            return (
              <span key={b.id} title={`${b.item.name} — ${b.name}`} style={{ fontSize: 22, opacity: owned ? 1 : 0.28, filter: owned ? 'none' : 'grayscale(1)' }}>
                {b.item.emoji}
              </span>
            );
          })}
          <span className="sl-hint" style={{ margin: 0, color: '#8a7045' }}>{t({ ko: '· 비콘(파란 점) 근처를 지나면 자동 획득', en: '· walk near a beacon to auto-collect' })}</span>
        </div>
      </div>

      <div className="sl-panel sl-panel-heritage">
        <HeritageMap sites={dsites} beacons={dbeacons} collectedItemIds={items} pos={pos} canSim={mode === 'sim'} onSimMove={setSimPos} onSiteClick={openSite} />
        <p className="sl-hint" style={{ color: '#bba980' }}>
          {mode === 'sim'
            ? t({ ko: '🧪 지도를 클릭해 이동하세요. 유적 반경(노란 원) 30m 안에 들면 미션이 자동으로 열립니다.', en: '🧪 Click the map to move. Enter a site’s 30 m radius (yellow circle) to auto-open its mission.' })
            : t({ ko: '📡 실시간 GPS{acc} — 유적 30m 이내 접근 시 미션 활성화.', en: '📡 Live GPS{acc} — missions activate within 30 m of a site.' }, { acc: accuracy ? ` (±${Math.round(accuracy)}m)` : '' })}
        </p>
      </div>

      {/* 유적 리스트 + CRUD */}
      <div className="sl-panel sl-panel-heritage">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 className="sl-h1 sl-h1-heritage" style={{ fontSize: 16, margin: 0 }}>🗺️ {t({ ko: '탐사 포인트', en: 'Exploration Points' })}</h3>
          {admin ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="sl-btn" onClick={() => setEditor({ site: emptySite(), isNew: true })}>＋ {t({ ko: '추가', en: 'Add' })}</button>
              <button className="sl-btn" title={t({ ko: '기본값 복원', en: 'Reset to defaults' })} onClick={() => { if (window.confirm(t({ ko: '유적을 기본 5곳으로 되돌릴까요? (추가/수정 내용 사라짐)', en: 'Reset to the default 5 sites? (added/edited data will be lost)' }))) { const s = resetSites(); setSites(s); } }}>↺</button>
            </div>
          ) : (
            <span className="sl-hint" style={{ margin: 0, color: '#8a7045' }}>🔧 {t({ ko: '관리자 모드에서 편집', en: 'Edit in admin mode' })}</span>
          )}
        </div>
        {sorted.map((s) => {
          const ls = L(s);
          const d = pos ? distanceTo(s, pos) : null;
          const near = inRange(s, pos);
          const done = doneIds.has(s.id);
          const shot = photoIds.has(s.id);
          return (
            <div key={s.id} className={`sl-her-row ${near ? 'near' : ''}`}>
              <span className="em">{s.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="nm">{ls.name} {done && '✅'}</div>
                <div className="meta">{localizeEra(s.era, lang)} · {ls.theme}{d !== null && ` · ${formatMeters(d)}`}{near && ` · 🎯 ${t({ ko: '범위 안', en: 'in range' })}`}</div>
              </div>
              <button className={`sl-btn ${done ? 'sl-mission-done' : near ? 'primary' : ''}`} style={{ padding: '8px 12px', whiteSpace: 'nowrap' }} onClick={() => openSite(s)}>
                {done ? `✅ ${t({ ko: '완료', en: 'Done' })}` : `${near ? '🎯' : '🧩'} ${t({ ko: '미션', en: 'Mission' })}`}
              </button>
              <button className={`sl-btn ${shot ? 'sl-shot-done' : ''}`} style={{ padding: '8px 10px' }} title={shot ? t({ ko: '인증샷 완료 — 다시 찍기', en: 'Photo taken — retake' }) : t({ ko: 'Time Warp 인증샷', en: 'Time Warp photo' })} onClick={() => setCamSite(L(s))}>{shot ? '📸✅' : '📸'}</button>
              {admin && <button className="sl-btn" style={{ padding: '8px 10px' }} onClick={() => setEditor({ site: s, isNew: false })}>✎</button>}
            </div>
          );
        })}
      </div>

      <HeritageArtifactLog sites={dsites} collected={collected} />

      {missionSite && (
        <HeritageMission site={missionSite} alreadyDone={doneIds.has(missionSite.id)} onSuccess={onSuccess} onClose={() => setMissionSite(null)} />
      )}
      {editor && (
        <HeritageSiteEditor initial={editor.site} isNew={editor.isNew} onSave={saveSite} onCancel={() => setEditor(null)} onDelete={editor.isNew ? undefined : deleteSite} />
      )}
      {camSite && (
        <TimeWarpCamera site={camSite} onClose={() => setCamSite(null)} onCapture={(url) => { collectPhoto(camSite.id, url); setCollected(loadCollected()); }} />
      )}

      {itemToast && (
        <div className="sl-item-toast" onClick={() => setItemToast(null)}>
          <span style={{ fontSize: 30 }}>{itemToast.item.emoji}</span>
          <div>
            <div style={{ fontWeight: 800 }}>{t({ ko: '아이템 획득!', en: 'Item collected!' })}</div>
            <div style={{ fontSize: 13 }}>{itemToast.item.name} <span style={{ opacity: 0.7 }}>· {itemToast.name}</span></div>
          </div>
        </div>
      )}
    </>
  );
}
