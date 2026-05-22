// 로그인이 없는 환경에서 '1인 1좋아요'를 근사하기 위한 익명 식별자.
// 브라우저 localStorage에 UUID를 한 번 발급해 계속 재사용한다.
export function getVoterId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('voterId');
  if (!id) {
    id = (crypto as any)?.randomUUID
      ? crypto.randomUUID()
      : `v-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem('voterId', id);
  }
  return id;
}
