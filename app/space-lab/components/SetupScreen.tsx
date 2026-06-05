'use client';
import { useState } from 'react';
import { LatLng, formatMeters, haversine } from '../lib/geo';
import { PERSONAS, Persona, START_PRESETS, GALDA } from '../lib/solar';
import StartPicker from './StartPicker';

export interface SetupResult {
  persona: Persona;
  nickname: string;
  start: LatLng;
  startName: string;
  presetKey: string | null;
}

export default function SetupScreen({ onStart }: { onStart: (r: SetupResult) => void }) {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [nickname, setNickname] = useState('');
  const [start, setStart] = useState<LatLng | null>(null);
  const [startName, setStartName] = useState('');
  const [presetKey, setPresetKey] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [geoErr, setGeoErr] = useState<string | null>(null);

  const pickPreset = (p: typeof START_PRESETS[number]) => {
    setStart(p.latlng); setStartName(p.name); setPresetKey(p.key); setPicking(false); setGeoErr(null);
  };
  const useCurrent = () => {
    setGeoErr(null);
    if (!navigator.geolocation) { setGeoErr('위치 기능을 지원하지 않습니다.'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setStart([pos.coords.latitude, pos.coords.longitude]); setStartName('현재 위치'); setPresetKey(null); setPicking(false); },
      (e) => setGeoErr(`위치 오류: ${e.message}`),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };
  const onMapPick = (p: LatLng) => { setStart(p); setStartName('지도 선택 지점'); setPresetKey(null); };

  const ready = persona && start;
  const distToGalda = start ? haversine(start, GALDA) : 0;

  return (
    <div className="sl-panel">
      <h2 className="sl-h1" style={{ fontSize: 20 }}>탐사 준비</h2>
      <p className="sl-sub">당신이 누구인지, 어디서 출발할지 정하세요.</p>

      {/* 페르소나 */}
      <div className="sl-label">1. 당신은 누구입니까?</div>
      <div className="sl-persona-grid" style={{ marginBottom: 18 }}>
        {PERSONAS.map((ps) => (
          <button key={ps.key} className={`sl-persona ${persona?.key === ps.key ? 'sel' : ''}`} onClick={() => setPersona(ps)}>
            <div className="emoji">{ps.emoji}</div>
            <div className="name">{ps.name}</div>
            <div className="tag">{ps.tagline}</div>
          </button>
        ))}
      </div>

      {/* 별명 */}
      <div className="sl-label">2. 별명 (선택)</div>
      <input
        className="sl-input"
        placeholder={persona ? persona.name : '예: 별빛탐사대 길동'}
        value={nickname}
        maxLength={20}
        onChange={(e) => setNickname(e.target.value)}
      />

      {/* 출발지 */}
      <div className="sl-label" style={{ marginTop: 18 }}>3. 출발지 (= 명왕성 39.5 AU)</div>
      <div className="sl-btn-row">
        {START_PRESETS.map((p) => (
          <button key={p.key} className={`sl-btn ${presetKey === p.key ? 'primary' : ''}`} onClick={() => pickPreset(p)}>
            {p.emoji} {p.name}
          </button>
        ))}
        <button className={`sl-btn ${startName === '현재 위치' ? 'primary' : ''}`} onClick={useCurrent}>📍 현재 위치</button>
        <button className={`sl-btn ${picking ? 'primary' : ''}`} onClick={() => setPicking((v) => !v)}>🗺️ 지도에서 선택</button>
      </div>
      {geoErr && <p className="sl-hint" style={{ color: '#ff9b9b' }}>{geoErr}</p>}
      {picking && (
        <div style={{ marginTop: 12 }}>
          <StartPicker value={start} onPick={onMapPick} />
          <p className="sl-hint">지도를 클릭해 출발지를 정하세요. (커스텀 출발지는 지형지물 가이드가 표시되지 않습니다)</p>
        </div>
      )}
      {start && (
        <p className="sl-hint">
          출발지: <strong style={{ color: 'var(--sl-text)' }}>{startName}</strong> · 갈다까지 {formatMeters(distToGalda)}
          {presetKey ? ' · 🗺️ 지형지물 가이드 제공' : ' · (커스텀, 가이드 없음)'}
        </p>
      )}

      <button
        className="sl-btn primary"
        style={{ width: '100%', marginTop: 18, opacity: ready ? 1 : 0.5 }}
        disabled={!ready}
        onClick={() => ready && onStart({ persona: persona!, nickname: nickname.trim() || persona!.name, start: start!, startName, presetKey })}
      >
        🚀 여정 시작
      </button>
    </div>
  );
}
