'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Library, Filter, Search, MapPin, Grid, X } from 'lucide-react';
import { format } from 'date-fns';
import Map from '../components/Map';

const LOCATIONS = ['전체', '갯벌', '바다', '논', '밭', '숲', '기타'];
const CATEGORIES = ['전체', '해양생물', '어류', '양서류', '파충류', '조류', '포유류', '곤충', '식물', '기타'];

// Vercel build fix: Wrapping in Suspense to avoid useSearchParams bailout
export default function GalleryPage() {
  return (
    <Suspense fallback={<div className="wide-container" style={{ textAlign: 'center', padding: '40px' }}>도감 불러오는 중...</div>}>
      <GalleryContent />
    </Suspense>
  );
}

function GalleryContent() {
  const searchParams = useSearchParams();
  const showSuccess = searchParams?.get('success');

  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableLocs, setAvailableLocs] = useState<string[]>([]);
  const [availableCats, setAvailableCats] = useState<string[]>([]);
  const [selectedLocs, setSelectedLocs] = useState<string[]>([]);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'masonry' | 'grid' | 'map'>('masonry');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  useEffect(() => {
    fetchAllSubmissions();
  }, []);

  // 모달이 열렸을 때 배경 스크롤 방지
  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedItem]);

  useEffect(() => {
    let filtered = allSubmissions;
    if (selectedLocs.length > 0) {
      filtered = filtered.filter(s => selectedLocs.includes(s.location));
    }
    if (selectedCats.length > 0) {
      filtered = filtered.filter(s => selectedCats.includes(s.category));
    }
    setSubmissions(filtered);
  }, [allSubmissions, selectedLocs, selectedCats]);

  const fetchAllSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/submissions');
      if (res.ok) {
        const data = await res.json();
        setAllSubmissions(data);

        const locs = Array.from(new Set(data.map((s: any) => s.location))).filter(Boolean) as string[];
        const cats = Array.from(new Set(data.map((s: any) => s.category))).filter(Boolean) as string[];
        setAvailableLocs(locs.sort());
        setAvailableCats(cats.sort());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleLoc = (loc: string) => {
    if (loc === '전체') {
      if (selectedLocs.length === availableLocs.length) {
        setSelectedLocs([]);
      } else {
        setSelectedLocs(availableLocs);
      }
      return;
    }
    setSelectedLocs(prev =>
      prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
    );
  };

  const toggleCat = (cat: string) => {
    if (cat === '전체') {
      if (selectedCats.length === availableCats.length) {
        setSelectedCats([]);
      } else {
        setSelectedCats(availableCats);
      }
      return;
    }
    setSelectedCats(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  return (
    <main className="wide-container">
      <div className="animate-fade-in-up">
        {showSuccess && (
          <div style={{ background: '#d1e7dd', color: '#0f5132', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontWeight: 600, textAlign: 'center' }}>
            ✨ 성공적으로 도감에 기록되었습니다!
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Library size={28} />
            우리의 도감
          </h1>
          <Link href="/submit" className="btn btn-primary" style={{ width: 'auto', padding: '8px 16px', fontSize: '14px' }}>
            + 추가
          </Link>
        </div>

        <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--primary)', fontWeight: 600, fontSize: '14px' }}>
              <Filter size={18} /> 장소 (중복 선택)
            </div>
            <div className="filter-chips">
              <button
                onClick={() => toggleLoc('전체')}
                className={`chip ${selectedLocs.length > 0 && selectedLocs.length === (allSubmissions.length > 0 ? Array.from(new Set(allSubmissions.map(s => s.location))).length : 0) ? 'active' : ''}`}
              >전체 ({allSubmissions.length})</button>
              {LOCATIONS.filter(l => l !== '전체').map(loc => {
                const count = allSubmissions.filter(s => s.location === loc).length;
                return (
                  <button
                    key={loc}
                    onClick={() => count > 0 && toggleLoc(loc)}
                    className={`chip ${selectedLocs.includes(loc) ? 'active' : ''}`}
                    style={{ opacity: count === 0 ? 0.4 : 1, cursor: count === 0 ? 'default' : 'pointer' }}
                  >
                    {loc}{count > 0 ? ` (${count})` : ''}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--primary)', fontWeight: 600, fontSize: '14px' }}>
              <Filter size={18} /> 종류 (중복 선택)
            </div>
            <div className="filter-chips">
              <button
                onClick={() => toggleCat('전체')}
                className={`chip ${selectedCats.length > 0 && selectedCats.length === (allSubmissions.length > 0 ? Array.from(new Set(allSubmissions.map(s => s.category))).length : 0) ? 'active' : ''}`}
              >전체 ({allSubmissions.length})</button>
              {CATEGORIES.filter(c => c !== '전체').map(cat => {
                const count = allSubmissions.filter(s => s.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => count > 0 && toggleCat(cat)}
                    className={`chip ${selectedCats.includes(cat) ? 'active' : ''}`}
                    style={{ opacity: count === 0 ? 0.4 : 1, cursor: count === 0 ? 'default' : 'pointer' }}
                  >
                    {cat}{count > 0 ? ` (${count})` : ''}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setViewMode('masonry')}
                className={`btn ${viewMode === 'masonry' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px 16px', display: 'flex', gap: '8px', alignItems: 'center', minWidth: '90px', justifyContent: 'center', height: '36px', fontSize: '13px', width: 'auto' }}
              >
                <Library size={14} /> 메이슨리
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px 16px', display: 'flex', gap: '8px', alignItems: 'center', minWidth: '90px', justifyContent: 'center', height: '36px', fontSize: '13px', width: 'auto' }}
              >
                <Grid size={14} /> 정사각형
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`btn ${viewMode === 'map' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px 16px', display: 'flex', gap: '8px', alignItems: 'center', minWidth: '90px', justifyContent: 'center', height: '36px', fontSize: '13px', width: 'auto' }}
              >
                <MapPin size={14} /> 지도
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            불러오는 중...
          </div>
        ) : submissions.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <Search size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <div>아직 등록된 기록이 없습니다.</div>
          </div>
        ) : viewMode === 'map' ? (
          <Map submissions={submissions} />
        ) : (
          <div className={viewMode === 'masonry' ? 'gallery-masonry' : 'gallery-grid-square'}>
            {submissions.map((item) => {
              const urls = JSON.parse(item.mediaUrls || '[]');
              const mainImg = urls.length > 0 ? urls[0] : null;

              return (
                <div key={item.id} className="gallery-card" onClick={() => setSelectedItem(item)} style={{ cursor: 'pointer' }}>
                  <div className="gallery-image-container">
                    {mainImg ? (
                      <img src={mainImg} alt={item.name} loading="lazy" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', background: '#f8f9fa' }}>
                        이미지 없음
                      </div>
                    )}
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

      {/* Detail Modal */}
      {selectedItem && (
        <div
          style={{ 
            position: 'fixed', 
            top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.8)', 
            backdropFilter: 'blur(8px)', 
            zIndex: 1000, 
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
          onClick={() => setSelectedItem(null)}
        >
          <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div
              className="glass-panel animate-fade-in-up"
              style={{ maxWidth: '800px', width: '100%', position: 'relative', padding: '24px' }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedItem(null)}
                style={{ position: 'absolute', top: '16px', right: '16px', background: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
              >
                <X size={20} />
              </button>

              <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '20px', background: '#000', display: 'flex', justifyContent: 'center' }}>
                <img
                  src={JSON.parse(selectedItem.mediaUrls || '[]')[0]}
                  alt={selectedItem.name}
                  style={{ width: 'auto', maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }}
                />
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
                {selectedItem.memo || "작성된 메모가 없습니다."}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
