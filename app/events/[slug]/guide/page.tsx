'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Library, Camera } from 'lucide-react';

export default function GuidePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [event, setEvent] = useState<any>(null);
  const [pages, setPages] = useState<{ title: string; content: string }[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/events?slug=${slug}`)
      .then(r => r.json())
      .then(data => {
        setEvent(data);
        const parsed = JSON.parse(data.guidePages || '[]');
        const filled = [0, 1, 2].map(i => parsed[i] || { title: '', content: '' });
        setPages(filled);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <main className="app-container"><div style={{ padding: '40px', textAlign: 'center' }}>불러오는 중...</div></main>;
  if (!event) return <main className="app-container"><div style={{ padding: '40px', textAlign: 'center' }}>행사를 찾을 수 없습니다.</div></main>;

  const page = pages[current];
  const isLast = current === pages.length - 1;

  return (
    <main className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <div className="animate-fade-in-up" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* 행사명 */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
            {new Date(event.startDate).toLocaleDateString('ko')} ~ {new Date(event.endDate).toLocaleDateString('ko')}
          </div>
          <h1 style={{ fontSize: '22px', margin: 0, color: 'var(--primary)' }}>{event.name}</h1>
        </div>

        {/* 페이지 내용 */}
        <div className="glass-panel" style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px', color: 'var(--primary)' }}>{page.title || `${current + 1}페이지`}</h2>
          <div style={{ flex: 1, fontSize: '16px', lineHeight: '1.8', whiteSpace: 'pre-wrap', color: 'var(--text)' }}>
            {page.content || '내용이 없습니다.'}
          </div>
        </div>

        {/* 페이지 점 + 네비게이션 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px' }}>
          <button
            onClick={() => setCurrent(c => c - 1)}
            disabled={current === 0}
            style={{ background: 'none', border: 'none', cursor: current === 0 ? 'default' : 'pointer', opacity: current === 0 ? 0.3 : 1, padding: '8px' }}
          >
            <ChevronLeft size={28} color="var(--primary)" />
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            {pages.map((_, i) => (
              <div
                key={i}
                onClick={() => setCurrent(i)}
                style={{ width: i === current ? '24px' : '10px', height: '10px', borderRadius: '5px', background: i === current ? 'var(--primary)' : 'rgba(0,0,0,0.15)', cursor: 'pointer', transition: 'all 0.3s' }}
              />
            ))}
          </div>

          {isLast ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => router.push(`/events/${slug}`)} className="btn btn-secondary" style={{ width: 'auto', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                <Library size={16} /> 도감 보기
              </button>
              <button onClick={() => router.push('/submit')} className="btn btn-primary" style={{ width: 'auto', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                <Camera size={16} /> 기록하기
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCurrent(c => c + 1)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
            >
              <ChevronRight size={28} color="var(--primary)" />
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
