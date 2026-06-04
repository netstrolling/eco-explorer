'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LatLng, haversine, formatMeters } from '../lib/geo';
import {
  SEOUL_STATION,
  GALDA,
  PLANETS,
  PERSONAS,
  Persona,
  positionToAU,
  progress,
  hasArrived,
  computeSunLocation,
  gravityMultiplier,
  currentOrbit,
} from '../lib/solar';
import { useGeolocation } from '../hooks/useGeolocation';
import CosmicProgressBar from './CosmicProgressBar';
import SpaceMap from './SpaceMap';

// 두 색 사이 선형 보간 (#rrggbb)
function lerpColor(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

// 진행도 t(0=심우주 → 1=태양)에 따른 동적 배경
function dynamicBackground(t: number) {
  const inner = lerpColor('#1a1140', '#ff6b35', t);
  const mid = lerpColor('#05060f', '#3a0a0a', t);
  return `radial-gradient(circle at 50% 115%, ${inner} 0%, ${mid} 45%, #05060f 82%)`;
}

export default function SolarJourney({ onBgChange }: { onBgChange: (bg: string) => void }) {
  const [persona, setPersona] = useState<Persona | null>(null);
  const { pos, mode, setMode, setSimPos, accuracy, error } = useGeolocation(SEOUL_STATION);
  const [points, setPoints] = useState(0);
  const [arrivalShown, setArrivalShown] = useState(false);
  const [showArrival, setShowArrival] = useState(false);
  const [toSun, setToSun] = useState(false);
  const prevPos = useRef<LatLng | null>(null);

  const sun = useMemo(() => computeSunLocation(), []);
  const au = pos ? positionToAU(pos) : 39.5;
  const p = progress(au);
  const orbit = currentOrbit(au);
  const grav = gravityMultiplier(au);
  const distToGalda = pos ? haversine(pos, GALDA) : haversine(SEOUL_STATION, GALDA);

  // 동적 배경: 태양 기준 진행도 (갈다 너머도 반영)
  useEffect(() => {
    const t = Math.max(0, Math.min(1, (39.5 - au) / 39.5));
    onBgChange(dynamicBackground(t));
  }, [au, onBgChange]);

  // 이동 거리 × 중력 가산점 적립
  useEffect(() => {
    if (!pos) return;
    if (prevPos.current) {
      const moved = haversine(prevPos.current, pos);
      if (moved > 0.5) setPoints((pt) => pt + Math.round(moved * grav));
    }
    prevPos.current = pos;
  }, [pos, grav]);

  // 갈다 도착 → 1회 팝업
  useEffect(() => {
    if (pos && hasArrived(pos) && !arrivalShown) {
      setArrivalShown(true);
      setShowArrival(true);
    }
  }, [pos, arrivalShown]);

  if (!persona) {
    return (
      <div className="sl-panel">
        <h2 className="sl-h1" style={{ fontSize: 20 }}>당신은 누구입니까?</h2>
        <p className="sl-sub">외계에서 지구(갈다)로 향하는 방문자를 고르세요.</p>
        <div className="sl-persona-grid">
          {PERSONAS.map((ps) => (
            <button key={ps.key} className="sl-persona" onClick={() => setPersona(ps)}>
              <div className="emoji">{ps.emoji}</div>
              <div className="name">{ps.name}</div>
              <div className="tag">{ps.tagline}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 모드 토글 */}
      <div className="sl-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <span style={{ fontSize: 28, marginRight: 8 }}>{persona.emoji}</span>
          <strong>{persona.name}</strong>
        </div>
        <div className="sl-seg">
          <button className={mode === 'sim' ? 'active' : ''} onClick={() => setMode('sim')}>🧪 시뮬레이터</button>
          <button className={mode === 'live' ? 'active' : ''} onClick={() => setMode('live')}>📡 실시간 GPS</button>
        </div>
      </div>

      {/* 상태 표시줄 */}
      <div className="sl-statusbar">
        현재 위치: <strong>{orbit.name}</strong> 궤도 통과 중 ({au.toFixed(2)} AU)…{' '}
        {p < 1 ? <>갈다까지 {formatMeters(distToGalda)} · <span className="sl-gravity">중력 가속 ×{grav.toFixed(1)}</span> 유지하세요!</> : '🌍 갈다 권역 진입!'}
      </div>
      {error && <div className="sl-statusbar" style={{ color: '#ff9b9b' }}>{error}</div>}

      {/* Cosmic Progress Bar */}
      <div className="sl-panel">
        <CosmicProgressBar shipEmoji={persona.emoji} currentAU={au} />
        <div className="sl-stat-grid">
          <div className="sl-stat"><div className="v">{au.toFixed(1)}</div><div className="k">현재 AU</div></div>
          <div className="sl-stat"><div className="v">{Math.round(p * 100)}%</div><div className="k">여정 진행</div></div>
          <div className="sl-stat"><div className="v">{points.toLocaleString()}</div><div className="k">탐사 포인트</div></div>
        </div>
      </div>

      {/* 행성 위치 가이드 — 각 행성이 실제로 서울 어디쯤인지 */}
      <div className="sl-panel">
        <h3 className="sl-h1" style={{ fontSize: 16 }}>🗺️ 행성 위치 가이드</h3>
        <p className="sl-sub" style={{ marginBottom: 10 }}>명왕성(서울역)→갈다 직선 위에 행성을 배치했습니다. 대략 이 부근입니다.</p>
        {PLANETS.map((pl) => (
          <div key={pl.key} className={`sl-guide-row ${pl.key === orbit.key ? 'active' : ''}`}>
            <span className="em">{pl.emoji}</span>
            <span className="nm">{pl.name}</span>
            <span className="au">{pl.au} AU</span>
            <span className="lm">📍 {pl.landmark}</span>
          </div>
        ))}
      </div>

      {/* 지도 */}
      <div className="sl-panel">
        <SpaceMap pos={pos} shipEmoji={persona.emoji} canSim={mode === 'sim'} onSimMove={setSimPos} />
        <p className="sl-hint">
          {mode === 'sim'
            ? '🧪 지도를 클릭해 우주선을 이동시키세요. 갈다(🌍)에 가까워질수록 중력 가속 보너스가 커집니다.'
            : `📡 실시간 GPS 추적 중${accuracy ? ` (정확도 ±${Math.round(accuracy)}m)` : ''}.`}
          {' '}점선은 명왕성→갈다→태양 벡터입니다.
        </p>
      </div>

      {/* Orbital Missions */}
      <div className="sl-panel">
        <h3 className="sl-h1" style={{ fontSize: 16 }}>🛰️ 궤도 미션 (Orbital Missions)</h3>
        {PLANETS.filter((pl) => pl.mission).map((pl) => (
          <div key={pl.key} className={`sl-mission ${pl.key === orbit.key ? 'active' : ''}`}>
            <div className="t">{pl.emoji} {pl.name} — {pl.mission!.title}{pl.key === orbit.key && ' · 진행 중'}</div>
            <div className="d">{pl.mission!.desc}</div>
          </div>
        ))}
      </div>

      {/* 도착 팝업 */}
      {showArrival && (
        <div className="sl-modal-backdrop" onClick={() => setShowArrival(false)}>
          <div className="sl-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 48 }}>🌍</div>
            <h2>갈다(지구)에 도착했습니다!</h2>
            <p>
              {persona.name}, 무사히 1.0 AU 지점에 안착했습니다. 적립 포인트: <strong>{points.toLocaleString()}</strong>
              <br /><br />
              벡터를 더 연장하면 <strong>태양(0 AU)</strong>이 매핑된 실제 지점이 있습니다.<br />
              좌표: {sun[0].toFixed(5)}, {sun[1].toFixed(5)} (삼청동 인근, 갈다에서 약 {formatMeters(haversine(GALDA, sun))} 방향)
            </p>
            <div className="sl-btn-row" style={{ justifyContent: 'center' }}>
              <button className="sl-btn sun" onClick={() => { setToSun(true); setShowArrival(false); }}>☀️ 태양까지 계속</button>
              <button className="sl-btn" onClick={() => setShowArrival(false)}>여기서 멈춤</button>
            </div>
          </div>
        </div>
      )}
      {toSun && <div className="sl-statusbar" style={{ borderColor: '#ff6b35' }}>☀️ 태양을 향해 항행을 계속합니다. 지도의 태양 지점으로 이동해 보세요.</div>}
    </>
  );
}
