'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Library, BookOpen, Camera, X, Search } from 'lucide-react';
import Map from '../../components/Map';

export default function EventGalleryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [event, setEvent] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  useEffect(() => {
    fetch(`/api/events?slug=${slug}`)
      .then(r => r.json())
      .then(async ev => {
        setEvent(ev);
        const res = await fetch(`/api/submissions?eventId=${ev.id}`);
        if (res.ok) setSubmissions(await res.json());
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selectedItem]);

  if (loading) return <main className="wide-container"><div style={{ padding: '40px', textAlign: 'center' }}>불러오는 중...</div></main>;
  if (!event) return <main className="wide-container"><div style={{ padding: '40px', textAlign: 'center' }}>행사를 찾을 수 없습니다.</div></main>;

  return (
    <main className="wide-container">
      <div className="animate-fade-in-up">

        {/* 행사 헤더 */}
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
            {new Date(event.startDate).toLocaleDateString('ko')} ~ {new Date(event.endDate).toLocaleDateString('ko')}
          </div>
          <h1 style={{ fontSize: '26px', margin: '0 0 16px 0', color: 'var(--primary)' }}>{event.name}</h1>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={`/events/${slug}/guide`} className="btn btn-secondary" style={{ width: 'auto', padding: '8px 18px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={16} /> 안내 보기
            </Link>
            <Link href="/submit" className="btn btn-primary" style={{ width: 'auto', padding: '8px 18px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Camera size={16} /> 기록하기
            </Link>
            <Link href="/gallery" className="btn btn-secondary" style={{ width: 'auto', padding: '8px 18px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Library size={16} /> 전체 도감
            </Link>
          </div>
        </div>

        {/* 보기 모드 + 통계 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            총 <strong style={{ color: 'var(--primary)' }}>{submissions.length}</strong>건 기록
          </div>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.03)', borderRadius: '12px', padding: '4px', border: '1px solid rgba(0,0,0,0.05)' }}>
            <button onClick={() => setViewMode('grid')} style={{ padding: '6px 14px', background: viewMode === 'grid' ? 'var(--primary)' : 'transparent', color: viewMode === 'grid' ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>그리드</button>
            <button onClick={() => setViewMode('map')} style={{ padding: '6px 14px', background: viewMode === 'map' ? 'var(--primary)' : 'transparent', color: viewMode === 'map' ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>지도</button>
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <Search size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <div>아직 등록된 기록이 없습니다.</div>
          </div>
        ) : viewMode === 'map' ? (
          <Map submissions={submissions} />
        ) : (
          <div className="gallery-grid-square">
            {submissions.map(item => {
              const urls = JSON.parse(item.mediaUrls || '[]');
              const mainImg = urls[0] || null;
              const isWiki = mainImg && (mainImg.includes('wikimedia.org') || mainImg.includes('wikipedia.org'));
              return (
                <div key={item.id} className="gallery-card" onClick={() => setSelectedItem(item)} style={{ cursor: 'pointer' }}>
                  <div className="gallery-image-container" style={isWiki ? { padding: '12px 12px 36px 12px', background: 'white', borderBottom: '1px solid rgba(0,0,0,0.05)', position: 'relative' } : {}}>
                    {mainImg ? (
                      <img src={mainImg} alt={item.name} loading="lazy" style={isWiki ? { borderRadius: '4px', border: '1px solid rgba(0,0,0,0.05)' } : {}} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', background: '#f8f9fa' }}>이미지 없음</div>
                    )}
                    {isWiki && <div style={{ position: 'absolute', bottom: '10px', right: '14px', fontSize: '11px', color: '#999', fontWeight: 500 }}>사진: 위키백과</div>}
                  </div>
                  <div className="gallery-info">
                    <div className="gallery-meta">
                      <span className="badge badge-category">{item.category}</span>
                      <span className="badge badge-location">{item.location}</span>
                    </div>
                    <div className="gallery-title">{item.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                      <span>{item.teamName}</span>
                      <span>{format(new Date(item.dateTime), 'MM/dd')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1010, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }} onClick={() => setSelectedItem(null)}>
          <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="glass-panel animate-fade-in-up" style={{ maxWidth: '800px', width: '100%', position: 'relative', padding: '24px' }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setSelectedItem(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
                <X size={20} />
              </button>
              <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '20px', background: '#000', display: 'flex', justifyContent: 'center' }}>
                <img src={JSON.parse(selectedItem.mediaUrls || '[]')[0]} alt={selectedItem.name} style={{ width: 'auto', maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ marginBottom: '4px', color: 'var(--primary)' }}>{selectedItem.name}</h2>
                  <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{selectedItem.teamName} · {format(new Date(selectedItem.dateTime), 'yyyy년 MM월 dd일 HH:mm')}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className="badge badge-location">{selectedItem.location}</span>
                  <span className="badge badge-category">{selectedItem.category}</span>
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.03)', padding: '16px', borderRadius: '12px', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '15px' }}>
                {selectedItem.memo || '작성된 메모가 없습니다.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
