// 기획1 Solar Journey — 태양 중심(heliocentric) 궤도 스케일 모델.
import { LatLng, haversine, bearing, destinationPoint } from './geo';

// 목적지(지구=갈다)는 고정. 출발지(명왕성)는 사용자가 프리셋/커스텀으로 선택.
export const GALDA: LatLng = [37.5876273, 126.9820544]; // 과학책방 갈다 (종로구 삼청로10길 18)

export const START_AU = 39.5; // 명왕성 = 출발지
export const EARTH_AU = 1.0; // 지구 = 갈다
export const SUN_AU = 0; // 태양 = 궤도 중심
const SPAN_AU = START_AU - EARTH_AU; // 38.5

export interface Planet {
  key: string;
  name: string;
  emoji: string;
  au: number; // 태양으로부터의 궤도 반경 (AU)
  color: string;
  axialTilt?: number; // 자전축 기울기(도) — 카메라 미션용
  mission?: { title: string; desc: string };
}

// au 내림차순(명왕성 → 태양).
export const PLANETS: Planet[] = [
  { key: 'pluto', name: '명왕성', emoji: '🪐', au: 39.5, color: '#8b9dc3', axialTilt: 122.5 },
  { key: 'neptune', name: '해왕성', emoji: '🔵', au: 30.1, color: '#4166f5', axialTilt: 28.3,
    mission: { title: '심해의 바람', desc: '가장 푸른색 오브젝트(표지판·벽·하늘)를 찾아 사진을 남기세요.' } },
  { key: 'uranus', name: '천왕성', emoji: '🩵', au: 19.2, color: '#7fdbe8', axialTilt: 97.8,
    mission: { title: '기울어진 자전축', desc: '거의 누운 천왕성처럼, 폰을 98° 기울여 세상을 담으세요.' } },
  { key: 'saturn', name: '토성', emoji: '🪐', au: 9.5, color: '#e3c08d', axialTilt: 26.7,
    mission: { title: '고리의 비밀', desc: '둥근 고리·원형 구조물(맨홀·표지·바퀴)을 토성 기울기로 담으세요.' } },
  { key: 'jupiter', name: '목성', emoji: '🟠', au: 5.2, color: '#d8a47f', axialTilt: 3.1,
    mission: { title: '거대 폭풍 관찰', desc: '가장 바람이 강하거나 복잡한 교차로를 사진으로 담으세요.' } },
  { key: 'belt', name: '소행성대', emoji: '☄️', au: 2.7, color: '#9c8f7a',
    mission: { title: '암석 지대 통과', desc: '울퉁불퉁한 돌·벽돌·자갈 질감을 클로즈업하세요.' } },
  { key: 'mars', name: '화성', emoji: '🔴', au: 1.52, color: '#c1440e', axialTilt: 25.2,
    mission: { title: '붉은 행성 탐색', desc: '주변에서 빨간색 오브젝트(우체통·간판 등)를 찾으세요.' } },
  { key: 'earth', name: '지구 · 갈다', emoji: '🌍', au: 1.0, color: '#2e8b57', axialTilt: 23.4 },
  { key: 'venus', name: '금성', emoji: '🟡', au: 0.72, color: '#e8c87a', axialTilt: 177.4,
    mission: { title: '뜨거운 베일', desc: '가장 더운 곳, 김이 나는 곳을 찾으세요.' } },
  { key: 'mercury', name: '수성', emoji: '⚪', au: 0.39, color: '#b0a89a', axialTilt: 0.03,
    mission: { title: '태양의 문지기', desc: '가장 강한 빛 반사(유리·금속)를 포착하세요.' } },
  { key: 'sun', name: '태양', emoji: '☀️', au: 0, color: '#ff6b35' },
];

// ── 영어 번역 맵 (지형지물 landmark는 한국 지명이라 KO 유지) ──
export const PLANET_EN: Record<string, { name: string; mission?: { title: string; desc: string } }> = {
  pluto: { name: 'Pluto' },
  neptune: { name: 'Neptune', mission: { title: 'Deep-sea Wind', desc: 'Find the bluest object (sign, wall, sky) and photograph it.' } },
  uranus: { name: 'Uranus', mission: { title: 'Tilted Axis', desc: 'Like nearly-sideways Uranus, tilt your phone 98° to capture the world.' } },
  saturn: { name: 'Saturn', mission: { title: "The Ring's Secret", desc: 'Capture a round/ring-shaped structure (manhole, sign, wheel) at Saturn’s tilt.' } },
  jupiter: { name: 'Jupiter', mission: { title: 'Great Storm Watch', desc: 'Photograph the windiest spot or the busiest intersection.' } },
  belt: { name: 'Asteroid Belt', mission: { title: 'Through the Rubble', desc: 'Close up a rough texture — stone, brick, or gravel.' } },
  mars: { name: 'Mars', mission: { title: 'Red Planet Hunt', desc: 'Find a red object nearby (mailbox, sign, etc.).' } },
  earth: { name: 'Earth · Galda' },
  venus: { name: 'Venus', mission: { title: 'Hot Veil', desc: 'Find the hottest spot or rising steam.' } },
  mercury: { name: 'Mercury', mission: { title: "Sun's Gatekeeper", desc: 'Catch the strongest light reflection (glass, metal).' } },
  sun: { name: 'Sun' },
};
export const PERSONA_EN: Record<string, { name: string; tagline: string }> = {
  asteroid: { name: 'Wandering Asteroid', tagline: 'A rock adrift for billions of years, pulled in by Earth’s gravity.' },
  alien: { name: 'Alien Intelligence', tagline: 'An explorer from an unknown civilization, observing the blue planet’s science.' },
  rocky: { name: 'Rocky (Project Hail Mary)', tagline: 'A friend from Erid, here to save the stars alongside humanity.' },
};
export const PRESET_EN: Record<string, string> = { 'seoul-station': 'Seoul Station', 'city-hall': 'City Hall', gwanghwamun: 'Gwanghwamun' };

// ── 출발지 프리셋 (행성별 지형지물은 각 출발지→갈다 직선 위 좌표를 역지오코딩해 사전 산출) ──
export interface StartPreset {
  key: string;
  name: string;
  emoji: string;
  latlng: LatLng;
  landmarks: Record<string, string>; // planet.key → 지형지물
}

export const START_PRESETS: StartPreset[] = [
  {
    key: 'seoul-station', name: '서울역', emoji: '🚉', latlng: [37.5560719, 126.9723599],
    landmarks: {
      pluto: '서울역 (출발지 · 회현동)', neptune: '서소문·한화빌딩 일대 (소공동)',
      uranus: '종로 삼봉로 일대 (종각 부근)', saturn: '국립민속박물관 (경복궁 동편)',
      jupiter: '삼청동 초입 (삼청로7가길)', belt: '삼청로 (삼청동)', mars: '북촌로 (삼청동, 갈다 직전)',
      earth: '과학책방 갈다 (삼청로10길 18)', venus: '삼청로10길 (갈다 너머 ~27m)',
      mercury: '국군서울지구병원 인근', sun: '국군서울지구병원 인근',
    },
  },
  {
    key: 'city-hall', name: '시청', emoji: '🏛️', latlng: [37.56679, 126.97842],
    landmarks: {
      pluto: '서울시청 (시민봉사실 · 무교동)', neptune: '청진옥 일대 (종로 해장국 골목)',
      uranus: '삼청로 (삼청동)', saturn: '팔판길 (삼청동)', jupiter: '스타벅스 삼청점',
      belt: '삼청로 (삼청동)', mars: '삼청로 (삼청동)', earth: '과학책방 갈다 (삼청로10길)',
      venus: '삼청로10길 (갈다 부근)', mercury: '삼청로10길 (갈다 부근)', sun: '국군서울지구병원 인근',
    },
  },
  {
    key: 'gwanghwamun', name: '광화문', emoji: '🗽', latlng: [37.57592, 126.97682],
    landmarks: {
      pluto: '광화문광장', neptune: '청운효자동', uranus: '청와대로 (청운효자동)',
      saturn: '삼청로7가길', jupiter: '삼청로 (삼청동)', belt: 'CU 종로삼청점', mars: '삼청로 (삼청동)',
      earth: '과학책방 갈다 (삼청로10길)', venus: '삼청로10길 (갈다 부근)', mercury: '삼청로10길 (갈다 부근)',
      sun: '국군서울지구병원 인근',
    },
  },
];

// ── 여정 설정: 선택한 출발지로부터 스케일·태양 좌표를 산출 ──
export interface Journey {
  start: LatLng;
  galda: LatLng;
  sun: LatLng; // 궤도 중심 (0 AU)
  metersPerAU: number;
  presetKey: string | null; // 프리셋이면 키, 커스텀이면 null (지형지물 가이드 표시 여부)
}

export function createJourney(start: LatLng, presetKey: string | null = null): Journey {
  const metersPerAU = haversine(start, GALDA) / SPAN_AU;
  const dirStartToGalda = bearing(start, GALDA);
  // 태양은 갈다(1AU)에서 출발지 반대 방향으로 1AU 더 간 지점.
  const sun = destinationPoint(GALDA, dirStartToGalda, EARTH_AU * metersPerAU);
  return { start, galda: GALDA, sun, metersPerAU, presetKey };
}

/** 태양 중심 반경거리 → 현재 AU. 방향과 무관(어느 궤도 위든 동일하게 판정). */
export function positionToAU(j: Journey, pos: LatLng): number {
  return haversine(pos, j.sun) / j.metersPerAU;
}

/** 태양 중심 궤도 반경(미터) — 지도에 동심원으로 그릴 때 사용. */
export function ringRadius(j: Journey, au: number): number {
  return au * j.metersPerAU;
}

/** 기준선(출발지→갈다) 위, 주어진 AU의 대표 좌표 — 행성 마커/지형지물 표시용. */
export function planetLocation(j: Journey, au: number): LatLng {
  const dirToStart = bearing(GALDA, j.start);
  return destinationPoint(GALDA, dirToStart, (au - EARTH_AU) * j.metersPerAU);
}

/** 여정 진행도 0(명왕성)~1(갈다). */
export function progress(au: number): number {
  return Math.max(0, Math.min(1, (START_AU - au) / SPAN_AU));
}

/** 갈다(실제 책방) 도착 판정 — 반경 40m. */
export function hasArrived(pos: LatLng): boolean {
  return haversine(pos, GALDA) <= 40;
}

/** 현재 AU가 속한 궤도 밴드의 행성 (이웃 궤도와의 중점으로 경계 산정). */
export function currentOrbit(au: number): Planet {
  for (let i = 0; i < PLANETS.length; i++) {
    const upper = i === 0 ? Infinity : (PLANETS[i].au + PLANETS[i - 1].au) / 2;
    const lower = i === PLANETS.length - 1 ? -Infinity : (PLANETS[i].au + PLANETS[i + 1].au) / 2;
    if (au < upper && au >= lower) return PLANETS[i];
  }
  return PLANETS[PLANETS.length - 1];
}

/** 통과한 행성 (현재보다 바깥 궤도 = au가 큼). */
export function passedPlanets(au: number): Planet[] {
  return PLANETS.filter((p) => p.au >= au && p.key !== 'sun');
}

/** 중력 가산점 배율 — 태양에 가까울수록 1/r²로 급증. 상한 80배. */
export function gravityMultiplier(au: number): number {
  const safeAU = Math.max(au, 0.3);
  return Math.max(1, Math.min(80, START_AU / safeAU));
}

export interface Persona {
  key: string;
  name: string;
  emoji: string;
  tagline: string;
}

export const PERSONAS: Persona[] = [
  { key: 'asteroid', name: '떠도는 소행성', emoji: '☄️', tagline: '수십억 년을 날아온 돌덩이. 지구의 중력에 이끌려 간다.' },
  { key: 'alien', name: '외계 지적생명체', emoji: '👽', tagline: '미지의 문명에서 온 탐사자. 푸른 행성의 과학을 관찰한다.' },
  { key: 'rocky', name: '록키 (헤일메리)', emoji: '🕷️', tagline: '에리드에서 온 친구. 인류와 함께 별을 구하러 왔다.' },
];
