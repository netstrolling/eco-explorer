'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { LatLng } from '../lib/geo';

export type GeoMode = 'sim' | 'live';

export interface GeoState {
  pos: LatLng | null;
  mode: GeoMode;
  error: string | null;
  accuracy: number | null;
}

/**
 * 공통 위치 훅.
 * - 'sim' 모드: 지도 클릭 등으로 setSimPos(latlng) 호출해 가짜 위치 이동 (데스크톱 테스트용).
 * - 'live' 모드: navigator.geolocation.watchPosition 으로 실시간 GPS 추적.
 * 초기값은 시뮬레이터 출발점(보통 서울역)을 받는다.
 */
export function useGeolocation(initial: LatLng) {
  const [mode, setMode] = useState<GeoMode>('sim');
  const [simPos, setSimPos] = useState<LatLng>(initial);
  const [livePos, setLivePos] = useState<LatLng | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);

  const stopWatch = useCallback(() => {
    if (watchId.current !== null && typeof navigator !== 'undefined') {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  useEffect(() => {
    if (mode !== 'live') {
      stopWatch();
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('이 브라우저는 위치 기능을 지원하지 않습니다.');
      return;
    }
    setError(null);
    watchId.current = navigator.geolocation.watchPosition(
      (p) => {
        setLivePos([p.coords.latitude, p.coords.longitude]);
        setAccuracy(p.coords.accuracy);
        setError(null);
      },
      (e) => setError(`위치 오류: ${e.message}`),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
    );
    return stopWatch;
  }, [mode, stopWatch]);

  const pos: LatLng | null = mode === 'live' ? livePos : simPos;

  return {
    pos,
    mode,
    setMode,
    setSimPos,
    accuracy: mode === 'live' ? accuracy : null,
    error,
  };
}
