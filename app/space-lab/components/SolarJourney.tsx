'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LatLng, haversine, formatMeters } from '../lib/geo';
import {
  GALDA, PLANETS, START_PRESETS, START_AU,
  createJourney, positionToAU, progress, hasArrived, gravityMultiplier, currentOrbit,
} from '../lib/solar';
import { useGeolocation } from '../hooks/useGeolocation';
import { createLog, updateLog } from '../lib/log';
import { Artifact, addArtifact, listArtifacts } from '../lib/artifacts';
import type { Planet } from '../lib/solar';
import CosmicProgressBar from './CosmicProgressBar';
import SpaceMap from './SpaceMap';
import SetupScreen, { SetupResult } from './SetupScreen';
import CameraMission from './CameraMission';
import ArtifactLog from './ArtifactLog';

function lerpColor(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}
function dynamicBackground(t: number) {
  const inner = lerpColor('#1a1140', '#ff6b35', t);
  const mid = lerpColor('#05060f', '#3a0a0a', t);
  return `radial-gradient(circle at 50% 115%, ${inner} 0%, ${mid} 45%, #05060f 82%)`;
}

export default function SolarJourney({ onBgChange }: { onBgChange: (bg: string) => void }) {
  const [setup, setSetup] = useState<SetupResult | null>(null);
  if (!setup) return <SetupScreen onStart={setSetup} />;
  return <JourneyView setup={setup} onBgChange={onBgChange} onReset={() => setSetup(null)} />;
}

function JourneyView({ setup, onBgChange, onReset }: { setup: SetupResult; onBgChange: (bg: string) => void; onReset: () => void }) {
  const journey = useMemo(() => createJourney(setup.start, setup.presetKey), [setup]);
  const landmarks = useMemo(
    () => (setup.presetKey ? START_PRESETS.find((p) => p.key === setup.presetKey)?.landmarks ?? null : null),
    [setup.presetKey]
  );

  const { pos, mode, setMode, setSimPos, accuracy, error } = useGeolocation(setup.start);
  const [points, setPoints] = useState(0);
  const [arrivalShown, setArrivalShown] = useState(false);
  const [showArrival, setShowArrival] = useState(false);
  const [toSun, setToSun] = useState(false);
  const prevPos = useRef<LatLng | null>(null);
  const logId = useRef<string | null>(null);
  const [camPlanet, setCamPlanet] = useState<Planet | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);

  useEffect(() => { setArtifacts(listArtifacts()); }, []);

  const handleCapture = (planet: Planet, dataUrl: string, capturedTilt: number) => {
    addArtifact({ planetKey: planet.key, planetName: planet.name, emoji: planet.emoji, dataUrl, tilt: capturedTilt, at: Date.now() });
    setArtifacts(listArtifacts());
    if (logId.current) {
      const done = Array.from(new Set([...(artifacts.map((a) => a.planetKey)), planet.key]));
      updateLog(logId.current, { missionsDone: done });
    }
  };

  const au = pos ? positionToAU(journey, pos) : START_AU;
  const p = progress(au);
  const orbit = currentOrbit(au);
  const grav = gravityMultiplier(au);
  const distToGalda = pos ? haversine(pos, GALDA) : haversine(setup.start, GALDA);

  // 로그 생성 (1회)
  useEffect(() => {
    logId.current = createLog({
      nickname: setup.nickname,
      personaKey: setup.persona.key,
      personaName: setup.persona.name,
      startName: setup.startName,
      start: setup.start,
      startedAt: Date.now(),
    });
  }, [setup]);

  // 동적 배경
  useEffect(() => {
    const t = Math.max(0, Math.min(1, (START_AU - au) / START_AU));
    onBgChange(dynamicBackground(t));
  }, [au, onBgChange]);

  // 이동 거리 × 중력 가산점
  useEffect(() => {
    if (!pos) return;
    if (prevPos.current) {
      const moved = haversine(prevPos.current, pos);
      if (moved > 0.5) {
        setPoints((pt) => {
          const next = pt + Math.round(moved * grav);
          if (logId.current) updateLog(logId.current, { points: next });
          return next;
        });
      }
    }
    prevPos.current = pos;
  }, [pos, grav]);

  // 도착
  useEffect(() => {
    if (pos && hasArrived(pos) && !arrivalShown) {
      setArrivalShown(true);
      setShowArrival(true);
      if (logId.current) updateLog(logId.current, { arrivedAt: Date.now() });
    }
  }, [pos, arrivalShown]);

  return (
    <>
      <div className="sl-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <span style={{ fontSize: 26, marginRight: 8 }}>{setup.persona.emoji}</span>
          <strong>{setup.nickname}</strong>
          <span style={{ color: 'var(--sl-muted)', fontSize: 12, marginLeft: 6 }}>출발: {setup.startName}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="sl-seg">
            <button className={mode === 'sim' ? 'active' : ''} onClick={() => setMode('sim')}>🧪 시뮬</button>
            <button className={mode === 'live' ? 'active' : ''} onClick={() => setMode('live')}>📡 GPS</button>
          </div>
          <button className="sl-btn" onClick={onReset}>↺</button>
        </div>
      </div>

      <div className="sl-statusbar">
        현재 위치: <strong>{orbit.name}</strong> 궤도 ({au.toFixed(2)} AU)…{' '}
        {p < 1 ? <>갈다까지 {formatMeters(distToGalda)} · <span className="sl-gravity">중력 가속 ×{grav.toFixed(1)}</span></> : '🌍 갈다 권역 진입!'}
      </div>
      {error && <div className="sl-statusbar" style={{ color: '#ff9b9b' }}>{error}</div>}

      <div className="sl-panel">
        <CosmicProgressBar shipEmoji={setup.persona.emoji} currentAU={au} />
        <div className="sl-stat-grid">
          <div className="sl-stat"><div className="v">{au.toFixed(1)}</div><div className="k">현재 AU</div></div>
          <div className="sl-stat"><div className="v">{Math.round(p * 100)}%</div><div className="k">여정 진행</div></div>
          <div className="sl-stat"><div className="v">{points.toLocaleString()}</div><div className="k">탐사 포인트</div></div>
        </div>
      </div>

      {/* 행성 위치 가이드 — 프리셋 출발지만 */}
      {landmarks && (
        <div className="sl-panel">
          <h3 className="sl-h1" style={{ fontSize: 16 }}>🗺️ 행성 위치 가이드</h3>
          <p className="sl-sub" style={{ marginBottom: 10 }}>{setup.startName}→갈다 직선 위 대략적 위치입니다.</p>
          {PLANETS.map((pl) => (
            <div key={pl.key} className={`sl-guide-row ${pl.key === orbit.key ? 'active' : ''}`}>
              <span className="em">{pl.emoji}</span>
              <span className="nm">{pl.name}</span>
              <span className="au">{pl.au} AU</span>
              <span className="lm">📍 {landmarks[pl.key] ?? '—'}</span>
            </div>
          ))}
        </div>
      )}

      {/* 지도 */}
      <div className="sl-panel">
        <SpaceMap journey={journey} landmarks={landmarks} currentOrbitKey={orbit.key} pos={pos} shipEmoji={setup.persona.emoji} canSim={mode === 'sim'} onSimMove={setSimPos} />
        <p className="sl-hint">
          {mode === 'sim'
            ? '🧪 지도를 클릭해 우주선을 이동시키세요. 동심원은 태양 중심 궤도입니다 — 어느 방향이든 같은 궤도 안이면 미션이 활성화됩니다.'
            : `📡 실시간 GPS 추적 중${accuracy ? ` (정확도 ±${Math.round(accuracy)}m)` : ''}.`}
        </p>
      </div>

      {/* 궤도 미션 */}
      <div className="sl-panel">
        <h3 className="sl-h1" style={{ fontSize: 16 }}>🛰️ 궤도 미션 (Orbital Missions)</h3>
        {PLANETS.filter((pl) => pl.mission).map((pl) => {
          const shot = artifacts.some((a) => a.planetKey === pl.key);
          return (
            <div key={pl.key} className={`sl-mission ${pl.key === orbit.key ? 'active' : ''}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div className="t">{pl.emoji} {pl.name} — {pl.mission!.title}{pl.key === orbit.key && ' · 현재 궤도'}{pl.axialTilt !== undefined && <span style={{ color: 'var(--sl-muted)', fontWeight: 400 }}> · 자전축 {pl.axialTilt}°</span>}</div>
                  <div className="d">{pl.mission!.desc}</div>
                </div>
                <button className={`sl-btn ${shot ? '' : 'primary'}`} style={{ padding: '8px 12px', whiteSpace: 'nowrap' }} onClick={() => setCamPlanet(pl)}>
                  {shot ? '✅ 재촬영' : '📷 촬영'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 도감 */}
      <ArtifactLog artifacts={artifacts} onChange={() => setArtifacts(listArtifacts())} />

      {/* 카메라 미션 모달 */}
      {camPlanet && (
        <CameraMission
          planet={camPlanet}
          onClose={() => setCamPlanet(null)}
          onCapture={(url, t) => handleCapture(camPlanet, url, t)}
        />
      )}

      {showArrival && (
        <div className="sl-modal-backdrop" onClick={() => setShowArrival(false)}>
          <div className="sl-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 48 }}>🌍</div>
            <h2>갈다(지구)에 도착했습니다!</h2>
            <p>
              {setup.nickname}, 무사히 1.0 AU 지점에 안착했습니다. 적립 포인트: <strong>{points.toLocaleString()}</strong>
              <br /><br />
              벡터를 더 연장하면 <strong>태양(0 AU)</strong>이 매핑된 지점이 있습니다.<br />
              좌표: {journey.sun[0].toFixed(5)}, {journey.sun[1].toFixed(5)} (갈다에서 약 {formatMeters(haversine(GALDA, journey.sun))})
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
