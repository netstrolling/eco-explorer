'use client';
// 참가자별 여정 로그 — 프로토타입이라 LocalStorage(기기 로컬)에 저장.
import { LatLng } from './geo';

const KEY = 'sl_journey_logs';

export interface JourneyLog {
  id: string;
  nickname: string;
  personaKey: string;
  personaName: string;
  startName: string;
  start: LatLng;
  startedAt: number; // epoch ms
  arrivedAt: number | null;
  points: number;
  missionsDone: string[]; // planet.key 목록
}

function read(): JourneyLog[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function write(logs: JourneyLog[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(logs));
}

export function listLogs(): JourneyLog[] {
  return read().sort((a, b) => b.startedAt - a.startedAt);
}

export function createLog(entry: Omit<JourneyLog, 'id' | 'arrivedAt' | 'points' | 'missionsDone'>): string {
  const id = `${entry.startedAt.toString(36)}-${Math.round(entry.start[0] * 1e4)}`;
  const logs = read();
  logs.push({ ...entry, id, arrivedAt: null, points: 0, missionsDone: [] });
  write(logs);
  return id;
}

export function updateLog(id: string, patch: Partial<JourneyLog>) {
  const logs = read();
  const i = logs.findIndex((l) => l.id === id);
  if (i >= 0) {
    logs[i] = { ...logs[i], ...patch };
    write(logs);
  }
}
