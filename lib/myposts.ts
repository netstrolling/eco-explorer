// 로그인 없이 '내가 올린 글'을 기억하기 위한 기기-로컬 저장소.
// 글을 올릴 때 받은 editToken을 함께 보관해, 본인 수정/삭제 시 서버에 권한을 증명한다.
// 형태: { [submissionId]: editToken }
const KEY = 'galdar_myposts';

type Store = Record<string, string>;

function read(): Store {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

function write(store: Store) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(store));
}

export function addMyPost(id: string, token: string) {
  const store = read();
  store[id] = token;
  write(store);
}

export function getMyPostToken(id: string): string | null {
  return read()[id] || null;
}

export function isMyPost(id: string): boolean {
  return !!read()[id];
}

export function removeMyPost(id: string) {
  const store = read();
  delete store[id];
  write(store);
}
