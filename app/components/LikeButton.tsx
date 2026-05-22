'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { getVoterId } from '@/lib/voter';

export default function LikeButton({
  submissionId,
  initialCount = 0,
  initialLiked = false,
  variant = 'card',
}: {
  submissionId: string;
  initialCount?: number;
  initialLiked?: boolean;
  variant?: 'card' | 'modal';
}) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initialLiked);
  const [busy, setBusy] = useState(false);

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);

    // 낙관적 업데이트
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount(c => c + (nextLiked ? 1 : -1));

    try {
      const res = await fetch(`/api/submissions/${submissionId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterId: getVoterId() }),
      });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setCount(data.count);
      } else {
        // 실패 시 롤백
        setLiked(!nextLiked);
        setCount(c => c + (nextLiked ? -1 : 1));
      }
    } catch {
      setLiked(!nextLiked);
      setCount(c => c + (nextLiked ? -1 : 1));
    } finally {
      setBusy(false);
    }
  };

  const isModal = variant === 'modal';

  return (
    <button
      onClick={toggle}
      aria-label={liked ? '좋아요 취소' : '좋아요'}
      title={liked ? '좋아요 취소' : '좋아요'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        background: isModal ? 'rgba(0,0,0,0.04)' : 'transparent',
        border: 'none',
        borderRadius: '20px',
        padding: isModal ? '6px 12px' : '2px 4px',
        cursor: 'pointer',
        color: liked ? '#e0245e' : 'var(--text-muted)',
        fontWeight: 600,
        fontSize: isModal ? '15px' : '13px',
        transition: 'color 0.15s, transform 0.1s',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <Heart
        size={isModal ? 20 : 17}
        fill={liked ? '#e0245e' : 'none'}
        style={{ transition: 'transform 0.1s' }}
      />
      {count > 0 && <span>{count}</span>}
    </button>
  );
}
