'use client';
import { useState } from 'react';
import { LatLng, formatMeters, haversine } from '../lib/geo';
import { PERSONAS, Persona, START_PRESETS, GALDA, PERSONA_EN, PRESET_EN } from '../lib/solar';
import { useI18n } from '../lib/i18n';
import StartPicker from './StartPicker';

export interface SetupResult {
  persona: Persona;
  nickname: string;
  start: LatLng;
  startName: string;
  presetKey: string | null;
}

export default function SetupScreen({ onStart }: { onStart: (r: SetupResult) => void }) {
  const { t } = useI18n();
  const [persona, setPersona] = useState<Persona | null>(null);
  const [nickname, setNickname] = useState('');
  const [start, setStart] = useState<LatLng | null>(null);
  const [startName, setStartName] = useState('');
  const [presetKey, setPresetKey] = useState<string | null>(null);
  const [isCurrent, setIsCurrent] = useState(false);
  const [picking, setPicking] = useState(false);
  const [geoErr, setGeoErr] = useState<string | null>(null);

  const personaName = (p: Persona) => t({ ko: p.name, en: PERSONA_EN[p.key]?.name ?? p.name });

  const pickPreset = (p: typeof START_PRESETS[number]) => {
    setStart(p.latlng); setStartName(t({ ko: p.name, en: PRESET_EN[p.key] ?? p.name }));
    setPresetKey(p.key); setIsCurrent(false); setPicking(false); setGeoErr(null);
  };
  const useCurrent = () => {
    setGeoErr(null);
    if (!navigator.geolocation) { setGeoErr(t({ ko: '위치 기능을 지원하지 않습니다.', en: 'Geolocation is not supported.' })); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setStart([pos.coords.latitude, pos.coords.longitude]); setStartName(t({ ko: '현재 위치', en: 'Current location' })); setPresetKey(null); setIsCurrent(true); setPicking(false); },
      (e) => setGeoErr(`${t({ ko: '위치 오류', en: 'Location error' })}: ${e.message}`),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };
  const onMapPick = (p: LatLng) => { setStart(p); setStartName(t({ ko: '지도 선택 지점', en: 'Map-picked point' })); setPresetKey(null); setIsCurrent(false); };

  const ready = persona && start;
  const distToGalda = start ? haversine(start, GALDA) : 0;

  return (
    <div className="sl-panel">
      <h2 className="sl-h1" style={{ fontSize: 20 }}>{t({ ko: '탐사 준비', en: 'Prepare to Explore' })}</h2>
      <p className="sl-sub">{t({ ko: '당신이 누구인지, 어디서 출발할지 정하세요.', en: 'Choose who you are and where you start.' })}</p>

      <div className="sl-label">1. {t({ ko: '당신은 누구입니까?', en: 'Who are you?' })}</div>
      <div className="sl-persona-grid" style={{ marginBottom: 18 }}>
        {PERSONAS.map((ps) => (
          <button key={ps.key} className={`sl-persona ${persona?.key === ps.key ? 'sel' : ''}`} onClick={() => setPersona(ps)}>
            <div className="emoji">{ps.emoji}</div>
            <div className="name">{personaName(ps)}</div>
            <div className="tag">{t({ ko: ps.tagline, en: PERSONA_EN[ps.key]?.tagline ?? ps.tagline })}</div>
          </button>
        ))}
      </div>

      <div className="sl-label">2. {t({ ko: '별명 (선택)', en: 'Nickname (optional)' })}</div>
      <input
        className="sl-input"
        placeholder={persona ? personaName(persona) : t({ ko: '예: 별빛탐사대 길동', en: 'e.g. Starlight Explorer' })}
        value={nickname}
        maxLength={20}
        onChange={(e) => setNickname(e.target.value)}
      />

      <div className="sl-label" style={{ marginTop: 18 }}>3. {t({ ko: '출발지 (= 명왕성 39.5 AU)', en: 'Starting point (= Pluto, 39.5 AU)' })}</div>
      <div className="sl-btn-row">
        {START_PRESETS.map((p) => (
          <button key={p.key} className={`sl-btn ${presetKey === p.key ? 'primary' : ''}`} onClick={() => pickPreset(p)}>
            {p.emoji} {t({ ko: p.name, en: PRESET_EN[p.key] ?? p.name })}
          </button>
        ))}
        <button className={`sl-btn ${isCurrent ? 'primary' : ''}`} onClick={useCurrent}>📍 {t({ ko: '현재 위치', en: 'Current location' })}</button>
        <button className={`sl-btn ${picking ? 'primary' : ''}`} onClick={() => setPicking((v) => !v)}>🗺️ {t({ ko: '지도에서 선택', en: 'Pick on map' })}</button>
      </div>
      {geoErr && <p className="sl-hint" style={{ color: '#ff9b9b' }}>{geoErr}</p>}
      {picking && (
        <div style={{ marginTop: 12 }}>
          <StartPicker value={start} onPick={onMapPick} />
          <p className="sl-hint">{t({ ko: '지도를 클릭해 출발지를 정하세요. (커스텀 출발지는 지형지물 가이드가 표시되지 않습니다)', en: 'Tap the map to set your start. (custom starts have no landmark guide)' })}</p>
        </div>
      )}
      {start && (
        <p className="sl-hint">
          {t({ ko: '출발지', en: 'Start' })}: <strong style={{ color: 'var(--sl-text)' }}>{startName}</strong> · {t({ ko: '갈다까지', en: 'to Galda' })} {formatMeters(distToGalda)}
          {presetKey ? ` · 🗺️ ${t({ ko: '지형지물 가이드 제공', en: 'landmark guide included' })}` : ` · ${t({ ko: '(커스텀, 가이드 없음)', en: '(custom, no guide)' })}`}
        </p>
      )}

      <button
        className="sl-btn primary"
        style={{ width: '100%', marginTop: 18, opacity: ready ? 1 : 0.5 }}
        disabled={!ready}
        onClick={() => ready && onStart({ persona: persona!, nickname: nickname.trim() || personaName(persona!), start: start!, startName, presetKey })}
      >
        🚀 {t({ ko: '여정 시작', en: 'Start Journey' })}
      </button>
    </div>
  );
}
