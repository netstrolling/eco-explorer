'use client';
import { useState } from 'react';
import { Site, Era, Mission } from '../lib/heritage';
import { LatLng } from '../lib/geo';
import StartPicker from './StartPicker';

interface Props {
  initial: Site;
  isNew: boolean;
  onSave: (s: Site) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
}

interface SearchHit { name: string; lat: number; lng: number; display: string; }

export default function HeritageSiteEditor({ initial, isNew, onSave, onCancel, onDelete }: Props) {
  const [s, setS] = useState<Site>(initial);
  const [picking, setPicking] = useState(false);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);
  const set = (patch: Partial<Site>) => setS((p) => ({ ...p, ...patch }));
  const setMission = (m: Mission) => setS((p) => ({ ...p, mission: m }));

  const kind = s.mission.kind;

  const search = async () => {
    if (!q.trim()) return;
    setSearching(true); setHits([]);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&accept-language=ko&countrycodes=kr&limit=5&q=${encodeURIComponent(q)}`);
      const j = await r.json();
      setHits(j.map((x: any) => ({ name: String(x.display_name).split(',')[0], lat: +x.lat, lng: +x.lon, display: x.display_name })));
    } catch { setHits([]); } finally { setSearching(false); }
  };
  const pickHit = (h: SearchHit) => { set({ name: s.name || h.name, lat: h.lat, lng: h.lng }); setHits([]); setQ(h.name); };

  const suggest = async () => {
    if (!s.name.trim()) return;
    setSuggesting(true); setAiErr(null);
    try {
      const r = await fetch('/api/space-lab/suggest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: s.name, theme: s.theme }),
      });
      const j = await r.json();
      if (!r.ok) { setAiErr(j.error || 'AI 추천 실패'); return; }
      setS((p) => ({
        ...p,
        theme: j.theme || p.theme, tagline: j.tagline || p.tagline, blurb: j.blurb || p.blurb,
        mission: j.mission || p.mission,
        artifact: { name: j.artifact?.name || p.artifact.name, emoji: j.artifact?.emoji || p.artifact.emoji },
      }));
    } catch { setAiErr('AI 추천 중 오류가 발생했습니다.'); } finally { setSuggesting(false); }
  };

  return (
    <div className="sl-modal-backdrop" onClick={onCancel}>
      <div className="sl-modal sl-modal-heritage" style={{ maxWidth: 480, textAlign: 'left', maxHeight: '88vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ color: '#3a2c12', textAlign: 'center' }}>{isNew ? '유적 추가' : '유적 수정'}</h2>

        {/* 장소 검색 자동완성 */}
        <label className="sl-flabel">🔍 장소 검색 (이름·좌표 자동 입력)
          <div style={{ display: 'flex', gap: 6 }}>
            <input className="sl-input sl-input-light" placeholder="예: 보신각, 경복궁, 환구단…" value={q}
              onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); search(); } }} />
            <button className="sl-btn" onClick={search} disabled={searching}>{searching ? '…' : '검색'}</button>
          </div>
        </label>
        {hits.length > 0 && (
          <div className="sl-search-list">
            {hits.map((h, i) => (
              <button key={i} className="sl-search-item" onClick={() => pickHit(h)}>📍 {h.display}</button>
            ))}
          </div>
        )}
        <button className="sl-btn primary" style={{ width: '100%', marginBottom: 6 }} onClick={suggest} disabled={!s.name.trim() || suggesting}>
          {suggesting ? '✨ AI가 작성 중…' : '✨ AI로 분야·설명·퀴즈 추천'}
        </button>
        {aiErr && <p className="sl-hint" style={{ color: '#b3261e' }}>{aiErr}</p>}
        {!s.name.trim() && <p className="sl-hint" style={{ color: '#8a7045' }}>먼저 장소를 검색하거나 이름을 입력하면 AI 추천을 받을 수 있어요.</p>}
        <hr className="sl-her-hr" />

        <div className="sl-field-row">
          <label className="sl-flabel">아이콘<input className="sl-input sl-input-light" value={s.emoji} maxLength={4} onChange={(e) => set({ emoji: e.target.value })} /></label>
          <label className="sl-flabel" style={{ flex: 2 }}>이름<input className="sl-input sl-input-light" value={s.name} onChange={(e) => set({ name: e.target.value })} /></label>
        </div>
        <div className="sl-field-row">
          <label className="sl-flabel">시대
            <select className="sl-input sl-input-light" value={s.era} onChange={(e) => set({ era: e.target.value as Era })}>
              <option value="조선">조선</option><option value="근대">근대</option>
            </select>
          </label>
          <label className="sl-flabel" style={{ flex: 2 }}>분야<input className="sl-input sl-input-light" value={s.theme} onChange={(e) => set({ theme: e.target.value })} /></label>
        </div>
        <label className="sl-flabel">한 줄 카피<input className="sl-input sl-input-light" value={s.tagline} onChange={(e) => set({ tagline: e.target.value })} /></label>
        <label className="sl-flabel">설명<textarea className="sl-input sl-input-light" rows={2} value={s.blurb} onChange={(e) => set({ blurb: e.target.value })} /></label>

        <div className="sl-field-row">
          <label className="sl-flabel">위도<input className="sl-input sl-input-light" type="number" step="0.0001" value={s.lat} onChange={(e) => set({ lat: +e.target.value })} /></label>
          <label className="sl-flabel">경도<input className="sl-input sl-input-light" type="number" step="0.0001" value={s.lng} onChange={(e) => set({ lng: +e.target.value })} /></label>
          <label className="sl-flabel">반경(m)<input className="sl-input sl-input-light" type="number" value={s.radius} onChange={(e) => set({ radius: +e.target.value })} /></label>
        </div>
        <button className="sl-btn" onClick={() => setPicking((v) => !v)}>🗺️ 지도에서 위치 선택</button>
        {picking && <div style={{ marginTop: 10 }}><StartPicker value={[s.lat, s.lng] as LatLng} onPick={(p) => set({ lat: p[0], lng: p[1] })} /></div>}

        <hr className="sl-her-hr" />
        <label className="sl-flabel">미션 종류
          <select className="sl-input sl-input-light" value={kind} onChange={(e) => {
            const k = e.target.value;
            if (k === 'quiz') setMission({ kind: 'quiz', prompt: '', options: ['', '', '', ''], answer: 0 });
            else setMission({ kind: 'timesync', prompt: '', toleranceMin: 4 });
          }}>
            <option value="quiz">객관식 퀴즈</option><option value="timesync">현재 시각 동기화</option>
          </select>
        </label>
        <label className="sl-flabel">질문/안내<input className="sl-input sl-input-light" value={s.mission.prompt} onChange={(e) => setMission({ ...s.mission, prompt: e.target.value } as Mission)} /></label>

        {s.mission.kind === 'quiz' && (
          <div>
            {s.mission.options.map((opt, i) => (
              <label key={i} className="sl-flabel" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <input type="radio" name="answer" checked={s.mission.kind === 'quiz' && s.mission.answer === i}
                  onChange={() => s.mission.kind === 'quiz' && setMission({ ...s.mission, answer: i })} />
                <input className="sl-input sl-input-light" placeholder={`보기 ${i + 1}`} value={opt}
                  onChange={(e) => { if (s.mission.kind === 'quiz') { const o = [...s.mission.options]; o[i] = e.target.value; setMission({ ...s.mission, options: o }); } }} />
              </label>
            ))}
            <p className="sl-hint" style={{ color: '#8a7045' }}>◉ 표시가 정답입니다.</p>
          </div>
        )}

        <hr className="sl-her-hr" />
        <div className="sl-field-row">
          <label className="sl-flabel">보상 아이콘<input className="sl-input sl-input-light" value={s.artifact.emoji} maxLength={4} onChange={(e) => set({ artifact: { ...s.artifact, emoji: e.target.value } })} /></label>
          <label className="sl-flabel" style={{ flex: 2 }}>수집 부품 이름<input className="sl-input sl-input-light" value={s.artifact.name} onChange={(e) => set({ artifact: { ...s.artifact, name: e.target.value } })} /></label>
        </div>

        <div className="sl-btn-row" style={{ marginTop: 16 }}>
          <button className="sl-btn primary" style={{ flex: 1 }} disabled={!s.name.trim()} onClick={() => onSave(s)}>저장</button>
          <button className="sl-btn" onClick={onCancel}>취소</button>
          {!isNew && onDelete && <button className="sl-btn" style={{ color: '#b3261e' }} onClick={() => onDelete(s.id)}>삭제</button>}
        </div>
      </div>
    </div>
  );
}
