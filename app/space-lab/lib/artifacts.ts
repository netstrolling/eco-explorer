'use client';
// 도감(Artifact Log) — 미션 촬영 사진을 LocalStorage에 저장(프로토타입).
// 용량 절약을 위해 캡처는 다운스케일 JPEG로 저장한다.

const KEY = 'sl_artifacts';

export interface Artifact {
  id: string;
  planetKey: string;
  planetName: string;
  emoji: string;
  dataUrl: string; // 다운스케일 JPEG
  tilt: number; // 촬영 시 자전축 목표각
  at: number; // epoch ms
}

function read(): Artifact[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function listArtifacts(): Artifact[] {
  return read().sort((a, b) => b.at - a.at);
}

/** 저장. 용량 초과 시 가장 오래된 항목을 지우며 재시도. 성공하면 id 반환, 실패 시 null. */
export function addArtifact(a: Omit<Artifact, 'id'>): string | null {
  if (typeof window === 'undefined') return null;
  const id = `${a.planetKey}-${a.at.toString(36)}`;
  const item: Artifact = { ...a, id };
  let logs = read();
  logs.unshift(item);
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(logs));
      return id;
    } catch {
      // QuotaExceeded → 가장 오래된 사진 제거 후 재시도
      if (logs.length <= 1) return null;
      logs = logs.slice(0, -1);
    }
  }
  return null;
}

export function removeArtifact(id: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(read().filter((a) => a.id !== id)));
}
