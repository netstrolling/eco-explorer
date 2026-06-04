// 기획1 Solar Journey — 태양계 스케일 매핑 로직.
import { LatLng, haversine, bearing, destinationPoint } from './geo';

// 출발지(명왕성) ↔ 목적지(지구=갈다) 고정 좌표
export const SEOUL_STATION: LatLng = [37.5560719, 126.9723599]; // 서울역
export const GALDA: LatLng = [37.5876273, 126.9820544]; // 과학책방 갈다 (종로구 삼청로10길 18)

export const START_AU = 39.5; // 명왕성
export const EARTH_AU = 1.0; // 지구 = 갈다
export const SUN_AU = 0; // 태양
const SPAN_AU = START_AU - EARTH_AU; // 38.5 — 여정 전체 구간

export interface Planet {
  key: string;
  name: string;
  emoji: string;
  au: number; // 태양으로부터의 거리 (AU)
  color: string;
  /** 명왕성→갈다 벡터 위 이 행성 좌표 근처의 실제 지형지물 (역지오코딩으로 사전 산출). */
  landmark: string;
  /** 행성별 과학 미션 (Orbital Mission). 출발/목적/태양 외 행성에만 부여. */
  mission?: { title: string; desc: string };
}

// 명왕성(출발) → 지구(목적) → 태양(0AU) 순서. au 내림차순.
export const PLANETS: Planet[] = [
  { key: 'pluto', name: '명왕성', emoji: '🪐', au: 39.5, color: '#8b9dc3', landmark: '서울역 (출발지 · 회현동)' },
  {
    key: 'neptune',
    name: '해왕성',
    emoji: '🔵',
    au: 30.1,
    color: '#4166f5',
    landmark: '서소문·한화빌딩 일대 (소공동)',
    mission: { title: '심해의 바람', desc: '가장 푸른색 오브젝트(표지판·벽·하늘)를 찾아 사진을 남기세요.' },
  },
  {
    key: 'uranus',
    name: '천왕성',
    emoji: '🩵',
    au: 19.2,
    color: '#7fdbe8',
    landmark: '종로 삼봉로 일대 (종각 부근)',
    mission: { title: '기울어진 자전축', desc: '비스듬히 기울어진 구조물이나 경사로를 찾으세요.' },
  },
  {
    key: 'saturn',
    name: '토성',
    emoji: '🪐',
    au: 9.5,
    color: '#e3c08d',
    landmark: '국립민속박물관 (경복궁 동편)',
    mission: { title: '고리의 비밀', desc: '주변에서 둥근 고리·원형 구조물(맨홀·표지·바퀴)을 발견하세요.' },
  },
  {
    key: 'jupiter',
    name: '목성',
    emoji: '🟠',
    au: 5.2,
    color: '#d8a47f',
    landmark: '삼청동 초입 (삼청로7가길)',
    mission: { title: '거대 폭풍 관찰', desc: '도심에서 가장 바람이 강하거나 복잡한 교차로를 사진으로 담으세요.' },
  },
  {
    key: 'belt',
    name: '소행성대',
    emoji: '☄️',
    au: 2.7,
    color: '#9c8f7a',
    landmark: '삼청로 (삼청동)',
    mission: { title: '암석 지대 통과', desc: '울퉁불퉁한 돌·벽돌·자갈 질감을 클로즈업하세요.' },
  },
  {
    key: 'mars',
    name: '화성',
    emoji: '🔴',
    au: 1.52,
    color: '#c1440e',
    landmark: '북촌로 (삼청동, 갈다 직전)',
    mission: { title: '붉은 행성 탐색', desc: '주변에서 빨간색 오브젝트(우체통·간판 등)를 찾으세요.' },
  },
  { key: 'earth', name: '지구 · 갈다', emoji: '🌍', au: 1.0, color: '#2e8b57', landmark: '과학책방 갈다 (삼청로10길 18)' },
  // 지구(갈다) 너머 — "태양까지 계속" 시 통과
  {
    key: 'venus',
    name: '금성',
    emoji: '🟡',
    au: 0.72,
    color: '#e8c87a',
    landmark: '삼청로10길 (갈다 너머 ~27m)',
    mission: { title: '뜨거운 베일', desc: '가장 더운 곳, 김이 나는 곳을 찾으세요.' },
  },
  {
    key: 'mercury',
    name: '수성',
    emoji: '⚪',
    au: 0.39,
    color: '#b0a89a',
    landmark: '국군서울지구병원 인근 (갈다 너머 ~57m)',
    mission: { title: '태양의 문지기', desc: '가장 강한 빛 반사(유리·금속)를 포착하세요.' },
  },
  { key: 'sun', name: '태양', emoji: '☀️', au: 0, color: '#ff6b35', landmark: '국군서울지구병원 인근 (갈다 너머 ~94m)' },
];

/** 명왕성→갈다 벡터 위에서 주어진 AU에 해당하는 실제 좌표.
 *  갈다(1AU) 기준, 바깥(au>1)은 명왕성 방향, 안쪽(au<1)은 태양 방향. */
export function planetLocation(au: number): LatLng {
  const total = haversine(SEOUL_STATION, GALDA); // 38.5AU에 해당
  const metersPerAU = total / SPAN_AU;
  const dirToPluto = bearing(GALDA, SEOUL_STATION);
  return destinationPoint(GALDA, dirToPluto, (au - EARTH_AU) * metersPerAU);
}

/** 현재 좌표 → 현재 AU 값. 갈다까지의 직선거리를 구간 비례로 환산. */
export function positionToAU(current: LatLng): number {
  const total = haversine(SEOUL_STATION, GALDA);
  const dToGalda = haversine(current, GALDA);
  return EARTH_AU + (dToGalda / total) * SPAN_AU;
}

/** 여정 진행도 0(명왕성)~1(갈다). 갈다 도착 시 1. */
export function progress(au: number): number {
  return Math.max(0, Math.min(1, (START_AU - au) / SPAN_AU));
}

/** 갈다 도착 판정 (반경 40m 이내). */
export function hasArrived(current: LatLng): boolean {
  return haversine(current, GALDA) <= 40;
}

/**
 * 출발지→갈다 벡터를 연장해 '태양(0AU)'이 위치할 실제 좌표를 계산.
 * 갈다는 1.0AU 지점이므로, 1AU에 해당하는 실제 거리만큼 더 진행한 곳이 태양.
 */
export function computeSunLocation(): LatLng {
  return planetLocation(SUN_AU);
}

/**
 * 중력 가산점 배율 — 태양(0AU)에 가까울수록 1/r² 로 급증 (실제 중력 메타포).
 * 명왕성 부근 ≈ 1배, 갈다(1AU) 부근 ≈ 큰 값. 과도한 폭주를 막기 위해 상한 적용.
 */
export function gravityMultiplier(au: number): number {
  const safeAU = Math.max(au, 0.3); // 0 나눗셈 방지
  // 명왕성(39.5)≈1배 → 갈다(1AU)≈39.5배 → 수성 부근 급증, 상한 80배.
  return Math.max(1, Math.min(80, START_AU / safeAU));
}

/** 통과한 행성 목록 (현재 au보다 바깥쪽 = au가 큰 행성들). */
export function passedPlanets(au: number): Planet[] {
  return PLANETS.filter((p) => p.au >= au && p.key !== 'sun');
}

/** 현재 가장 가까운(=다음 통과할) 행성 궤도. */
export function currentOrbit(au: number): Planet {
  // au 이하 중 가장 큰 au를 가진 행성 = 지금 들어선 궤도
  const inner = PLANETS.filter((p) => p.au <= au);
  return inner.length ? inner[0] : PLANETS[PLANETS.length - 1];
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
