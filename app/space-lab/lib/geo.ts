// 공통 지오 유틸 — 기획1(Solar Journey)과 기획2(과학의 길)가 공유.
// 모든 좌표는 [위도, 경도] (LatLng) 튜플로 통일한다.

export type LatLng = [number, number];

const R = 6371000; // 지구 반지름 (m)
const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/** 두 좌표 사이의 대권 거리 (미터). */
export function haversine(a: LatLng, b: LatLng): number {
  const [lat1, lon1] = a;
  const [lat2, lon2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** a에서 b를 바라보는 초기 방위각 (도, 0~360, 북=0). */
export function bearing(a: LatLng, b: LatLng): number {
  const [lat1, lon1] = a;
  const [lat2, lon2] = b;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** 시작점에서 주어진 방위각으로 distance(m)만큼 이동한 좌표 (벡터 연장에 사용). */
export function destinationPoint(
  start: LatLng,
  bearingDeg: number,
  distance: number
): LatLng {
  const δ = distance / R;
  const θ = toRad(bearingDeg);
  const φ1 = toRad(start[0]);
  const λ1 = toRad(start[1]);

  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
  );
  const λ2 =
    λ1 +
    Math.atan2(
      Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
      Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
    );

  return [toDeg(φ2), ((toDeg(λ2) + 540) % 360) - 180];
}

export const formatMeters = (m: number) =>
  m >= 1000 ? `${(m / 1000).toFixed(2)}km` : `${Math.round(m)}m`;
