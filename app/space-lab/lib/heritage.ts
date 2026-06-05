'use client';
// 기획2 K-Science Heritage — 조선·근대 과학사 유적 탐사 데이터 + CRUD(LocalStorage) + Geofencing.
import { LatLng, haversine } from './geo';

export type Era = '조선' | '근대';

// 미션 종류: quiz(객관식) / timesync(현재시각 동기화)
export type Mission =
  | { kind: 'quiz'; prompt: string; options: string[]; answer: number }
  | { kind: 'timesync'; prompt: string; toleranceMin: number };

export interface Site {
  id: string;
  name: string;
  emoji: string;
  era: Era;
  theme: string; // 분야 (예: 근대 표준시)
  tagline: string; // 한 줄 카피
  blurb: string; // 역사 설명
  lat: number;
  lng: number;
  radius: number; // geofence 반경(m)
  mission: Mission;
  artifact: { name: string; emoji: string }; // 성공 시 수집 부품
}

const SITES_KEY = 'sl_heritage_sites';
const ARTI_KEY = 'sl_heritage_artifacts';

// ── 기본 제공 유적 5곳 ──
export const SEED_SITES: Site[] = [
  {
    id: 'seoul-station-old', name: '구 서울역사', emoji: '🕰️', era: '근대', theme: '근대 표준시',
    tagline: '조선의 시간에서 근대의 시간으로.',
    blurb: '1925년 준공된 옛 서울역(문화역서울284). 기차 시각표와 함께 근대적 표준시 개념이 일상에 들어왔다.',
    lat: 37.55599, lng: 126.97155, radius: 30,
    mission: { kind: 'timesync', prompt: '근대의 시계에 맞춰 현재 시각을 24시간제 HH:MM 으로 입력해 동기화하세요.', toleranceMin: 4 },
    artifact: { name: '표준시계 톱니', emoji: '⏱️' },
  },
  {
    id: 'seonhyecheong', name: '남대문 선혜청 터', emoji: '⚖️', era: '조선', theme: '도량형',
    tagline: '공정한 측정의 시작.',
    blurb: '대동법 시행 기관 선혜청 자리. 공물·세곡을 정확히 거두기 위해 도량형(길이·부피·무게)의 표준이 중요했다.',
    lat: 37.55880, lng: 126.97560, radius: 30,
    mission: { kind: 'quiz', prompt: '조선의 길이 표준 단위 1자(尺)는 대략 몇 cm일까요?', options: ['약 30cm', '약 10cm', '약 100cm', '약 5cm'], answer: 0 },
    artifact: { name: '유척(鍮尺) 조각', emoji: '📏' },
  },
  {
    id: 'supyogyo', name: '청계천 수표교 터', emoji: '🌊', era: '조선', theme: '수리학·치수',
    tagline: '가장 정밀한 눈금.',
    blurb: '청계천 수위를 재던 수표(水標)가 있던 다리 터. 홍수를 예측·대비하기 위한 조선의 치수(治水) 과학.',
    lat: 37.56820, lng: 126.99015, radius: 30,
    mission: { kind: 'quiz', prompt: '다리 옆 수표(水標)는 무엇을 측정했을까요?', options: ['청계천 물 높이(수위)', '다리의 길이', '하루의 시각', '바람의 세기'], answer: 0 },
    artifact: { name: '수표 눈금', emoji: '📐' },
  },
  {
    id: 'gwancheondae', name: '관상감 관천대', emoji: '🔭', era: '조선', theme: '천문 관측',
    tagline: '하늘의 암호를 읽다.',
    blurb: '관상감이 천체를 관측하던 관천대(보물). 현재 현대건설 사옥 앞에 남아 있다. 천문·역법을 담당했다.',
    lat: 37.57620, lng: 126.98555, radius: 30,
    mission: { kind: 'quiz', prompt: '천체의 운행과 위치를 재던 조선의 대표 천문 기구는?', options: ['혼천의', '측우기', '자격루', '앙부일구'], answer: 0 },
    artifact: { name: '혼천의 조각', emoji: '⚙️' },
  },
  {
    id: 'jejungwon', name: '제중원 터', emoji: '⚕️', era: '근대', theme: '근대 의학',
    tagline: '생명을 살리는 근대 의학.',
    blurb: '1885년 세워진 한국 최초의 근대식 병원. 현재 헌법재판소 자리. 서양 의학이 본격 도입된 출발점.',
    lat: 37.57813, lng: 126.98485, radius: 30,
    mission: { kind: 'quiz', prompt: '제중원이 처음 문을 열 때의 이름은?', options: ['광혜원', '활인서', '혜민서', '전의감'], answer: 0 },
    artifact: { name: '제중원 의학서 한 장', emoji: '📖' },
  },
];

// ── 유적 CRUD (LocalStorage) ──
export function loadSites(): Site[] {
  if (typeof window === 'undefined') return SEED_SITES;
  try {
    const raw = window.localStorage.getItem(SITES_KEY);
    if (!raw) { window.localStorage.setItem(SITES_KEY, JSON.stringify(SEED_SITES)); return SEED_SITES; }
    return JSON.parse(raw);
  } catch {
    return SEED_SITES;
  }
}

export function saveSites(sites: Site[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SITES_KEY, JSON.stringify(sites));
}

export function resetSites(): Site[] {
  saveSites(SEED_SITES);
  return SEED_SITES;
}

export function emptySite(): Site {
  return {
    id: `site-${Math.random().toString(36).slice(2, 8)}`,
    name: '', emoji: '📍', era: '조선', theme: '', tagline: '', blurb: '',
    lat: 37.5759, lng: 126.9769, radius: 30,
    mission: { kind: 'quiz', prompt: '', options: ['', '', '', ''], answer: 0 },
    artifact: { name: '', emoji: '🏺' },
  };
}

// ── 도감(수집한 부품 + Time Warp 인증샷) ──
export interface Collected { siteId: string; name?: string; emoji?: string; photoUrl?: string; at: number; }

export function loadCollected(): Collected[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(window.localStorage.getItem(ARTI_KEY) || '[]'); } catch { return []; }
}

function upsert(siteId: string, patch: Partial<Collected>) {
  if (typeof window === 'undefined') return;
  const list = loadCollected();
  const i = list.findIndex((x) => x.siteId === siteId);
  if (i >= 0) list[i] = { ...list[i], ...patch, at: Date.now() };
  else list.push({ siteId, at: Date.now(), ...patch });
  try {
    window.localStorage.setItem(ARTI_KEY, JSON.stringify(list));
  } catch {
    // 사진 용량 초과 시: 가장 오래된 사진부터 비우며 재시도
    const trimmed = [...list].sort((a, b) => a.at - b.at);
    for (const t of trimmed) {
      if (t.photoUrl && t.siteId !== siteId) { delete t.photoUrl; try { window.localStorage.setItem(ARTI_KEY, JSON.stringify(list)); return; } catch { /* 계속 */ } }
    }
  }
}

/** 퀴즈 성공 → 유물 부품 수집. */
export function collect(c: { siteId: string; name: string; emoji: string }) {
  upsert(c.siteId, { name: c.name, emoji: c.emoji });
}

/** Time Warp 인증샷 저장. */
export function collectPhoto(siteId: string, photoUrl: string) {
  upsert(siteId, { photoUrl });
}

// ── Geofencing ──
export function distanceTo(site: Site, pos: LatLng): number {
  return haversine([site.lat, site.lng], pos);
}
export function inRange(site: Site, pos: LatLng | null): boolean {
  return pos ? distanceTo(site, pos) <= site.radius : false;
}

/** timesync 미션 검증: 입력 HH:MM 이 현재 시각 ±tolerance(분) 이내인가. */
export function checkTimeSync(input: string, toleranceMin: number, now: Date): boolean {
  const m = input.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return false;
  const h = +m[1], min = +m[2];
  if (h > 23 || min > 59) return false;
  const inputMin = h * 60 + min;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  let diff = Math.abs(inputMin - nowMin);
  diff = Math.min(diff, 1440 - diff); // 자정 경계
  return diff <= toleranceMin;
}
