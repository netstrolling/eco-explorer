'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { BookOpen, Camera, X, Search, Filter, Trophy, MapPin, Grid, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import Map from '../../components/Map';
import LikeButton from '../../components/LikeButton';
import { getVoterId } from '@/lib/voter';

const LOCATIONS = ['전체', '갯벌', '바다', '논', '밭', '숲', '기타'];
const CATEGORIES = ['전체', '해양생물', '어류', '양서류', '파충류', '조류', '포유류', '곤충', '식물', '기타'];

export default function EventGalleryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [event, setEvent] = useState<any>(null);
  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'group' | 'map'>('grid');
  const [availableLocs, setAvailableLocs] = useState<string[]>([]);
  const [availableCats, setAvailableCats] = useState<string[]>([]);
  const [selectedLocs, setSelectedLocs] = useState<string[]>([]);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/events?slug=${slug}`)
      .then(r => r.json())
      .then(async ev => {
        setEvent(ev);
        const res = await fetch(`/api/submissions?eventId=${ev.id}&voterId=${encodeURIComponent(getVoterId())}`);
        if (res.ok) {
          const data = await res.json();
          setAllSubmissions(data);
          setAvailableLocs(Array.from(new Set(data.map((s: any) => s.location))).filter(Boolean).sort() as string[]);
          setAvailableCats(Array.from(new Set(data.map((s: any) => s.category))).filter(Boolean).sort() as string[]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    let filtered = allSubmissions;
    if (selectedLocs.length > 0) filtered = filtered.filter(s => selectedLocs.includes(s.location));
    if (selectedCats.length > 0) filtered = filtered.filter(s => selectedCats.includes(s.category));
    setSubmissions(filtered);
  }, [allSubmissions, selectedLocs, selectedCats]);

  useEffect(() => {
    document.body.style.overflow = (selectedItem || selectedGroup) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedItem, selectedGroup]);

  // 현재 필터 기준 기록된 종 수 (이름 기준 고유 개수)
  const speciesCount = Array.from(new Set(submissions.map(s => s.name))).filter(Boolean).length;

  const toggleLoc = (loc: string) => {
    if (loc === '전체') { setSelectedLocs(selectedLocs.length === availableLocs.length ? [] : availableLocs); return; }
    setSelectedLocs(prev => prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]);
  };

  const toggleCat = (cat: string) => {
    if (cat === '전체') { setSelectedCats(selectedCats.length === availableCats.length ? [] : availableCats); return; }
    setSelectedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  if (loading) return <main className="wide-container"><div style={{ padding: '40px', textAlign: 'center' }}>불러오는 중...</div></main>;
  if (!event) return <main className="wide-container"><div style={{ padding: '40px', textAlign: 'center' }}>행사를 찾을 수 없습니다.</div></main>;

  return (
    <main className="wide-container">
      <div className="animate-fade-in-up">

        {/* 행사 헤더 */}
        <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            {new Date(event.startDate).toLocaleDateString('ko')} ~ {new Date(event.endDate).toLocaleDateString('ko')}
          </div>
          <h1 style={{ fontSize: '24px', margin: '0 0 12px 0', color: 'var(--primary)' }}>{event.name}</h1>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>{speciesCount}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>기록된 종</span>
            </div>
            <div style={{ width: '1px', background: 'rgba(0,0,0,0.08)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>{submissions.length}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>전체 기록</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={`/events/${slug}/guide`} className="btn btn-secondary" style={{ width: 'auto', padding: '8px 16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={15} /> 안내 보기
            </Link>
            <Link href="/submit" className="btn btn-primary" style={{ width: 'auto', padding: '8px 16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Camera size={15} /> 기록하기
            </Link>
          </div>
        </div>

        {/* 상단 바: 보기모드 + 랭킹 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.03)', borderRadius: '12px', padding: '4px', border: '1px solid rgba(0,0,0,0.05)' }}>
            <button onClick={() => setViewMode('grid')} title="그리드 보기" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: viewMode === 'grid' ? 'var(--primary)' : 'transparent', color: viewMode === 'grid' ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: '8px', cursor: 'pointer', height: '36px' }}>
              <Grid size={18} />
            </button>
            <button onClick={() => setViewMode('group')} title="종별 모아보기" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: viewMode === 'group' ? 'var(--primary)' : 'transparent', color: viewMode === 'group' ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: '8px', cursor: 'pointer', height: '36px' }}>
              <Layers size={18} />
            </button>
            <button onClick={() => setViewMode('map')} title="지도 보기" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: viewMode === 'map' ? 'var(--primary)' : 'transparent', color: viewMode === 'map' ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: '8px', cursor: 'pointer', height: '36px' }}>
              <MapPin size={18} />
            </button>
          </div>
          <Link href="/ranking" className="btn btn-secondary" style={{ width: 'auto', padding: '8px 16px', fontSize: '14px', background: 'var(--primary-light)', color: 'white', border: 'none', height: '36px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Trophy size={16} /> 랭킹
          </Link>
        </div>

        {/* 필터 패널 */}
        <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }} onClick={() => setIsFilterOpen(!isFilterOpen)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 600, fontSize: '15px' }}>
              <Filter size={18} /> 생물 종류 및 장소
              {((selectedLocs.length > 0 && selectedLocs.length !== availableLocs.length) || (selectedCats.length > 0 && selectedCats.length !== availableCats.length)) && (
                <span style={{ fontSize: '12px', background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '12px' }}>적용 중</span>
              )}
            </div>
            {isFilterOpen ? <ChevronUp size={20} color="var(--primary)" /> : <ChevronDown size={20} color="var(--primary)" />}
          </div>

          {isFilterOpen && (
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(0,0,0,0.05)' }} className="animate-fade-in-up">
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--primary)', fontWeight: 600, fontSize: '14px' }}>장소 (중복 선택)</div>
                <div className="filter-chips">
                  <button onClick={() => toggleLoc('전체')} className={`chip ${selectedLocs.length === availableLocs.length && availableLocs.length > 0 ? 'active' : ''}`}>전체 ({allSubmissions.length})</button>
                  {LOCATIONS.filter(l => l !== '전체').map(loc => {
                    const count = allSubmissions.filter(s => s.location === loc).length;
                    return (
                      <button key={loc} onClick={() => count > 0 && toggleLoc(loc)} className={`chip ${selectedLocs.includes(loc) ? 'active' : ''}`} style={{ opacity: count === 0 ? 0.4 : 1, cursor: count === 0 ? 'default' : 'pointer' }}>
                        {loc}{count > 0 ? ` (${count})` : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--primary)', fontWeight: 600, fontSize: '14px' }}>종류 (중복 선택)</div>
                <div className="filter-chips">
                  <button onClick={() => toggleCat('전체')} className={`chip ${selectedCats.length === availableCats.length && availableCats.length > 0 ? 'active' : ''}`}>전체 ({allSubmissions.length})</button>
                  {CATEGORIES.filter(c => c !== '전체').map(cat => {
                    const count = allSubmissions.filter(s => s.category === cat).length;
                    return (
                      <button key={cat} onClick={() => count > 0 && toggleCat(cat)} className={`chip ${selectedCats.includes(cat) ? 'active' : ''}`} style={{ opacity: count === 0 ? 0.4 : 1, cursor: count === 0 ? 'default' : 'pointer' }}>
                        {cat}{count > 0 ? ` (${count})` : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {submissions.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <Search size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <div>아직 등록된 기록이 없습니다.</div>
          </div>
        ) : viewMode === 'map' ? (
          <Map submissions={submissions} />
        ) : viewMode === 'group' ? (
          <div className="gallery-grid-square">
            {(Object.entries(
              submissions.reduce((acc, curr) => {
                if (!acc[curr.name]) acc[curr.name] = [];
                acc[curr.name].push(curr);
                return acc;
              }, {} as Record<string, any[]>)
            ) as [string, any[]][]).sort((a, b) => b[1].length - a[1].length).map(([name, subs]) => {
              const mainSub = subs[0];
              const urls = JSON.parse(mainSub.mediaUrls || '[]');
              const mainImg = urls.length > 0 ? urls[0] : null;
              const isWiki = mainImg && (mainImg.includes('wikimedia.org') || mainImg.includes('wikipedia.org'));
              return (
                <div key={name} className="gallery-card" onClick={() => setSelectedGroup(name)} style={{ cursor: 'pointer' }}>
                  <div className="gallery-image-container" style={isWiki ? { padding: '12px 12px 36px 12px', background: 'white', borderBottom: '1px solid rgba(0,0,0,0.05)', position: 'relative' } : {}}>
                    {mainImg ? (
                      <img src={mainImg} alt={name} loading="lazy" style={isWiki ? { borderRadius: '4px', border: '1px solid rgba(0,0,0,0.05)' } : {}} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', background: '#f8f9fa' }}>이미지 없음</div>
                    )}
                    {isWiki && <div style={{ position: 'absolute', bottom: '10px', right: '14px', fontSize: '11px', color: '#999', fontWeight: 500 }}>사진: 위키백과</div>}
                  </div>
                  <div className="gallery-info">
                    <div className="gallery-meta">
                      <span className="badge badge-category">{mainSub.category}</span>
                    </div>
                    <div className="gallery-title">{name}</div>
                    <div style={{ marginTop: '8px' }}>
                      <span className="badge" style={{ background: 'var(--primary)', color: 'white' }}>{subs.length}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
                    <div style={{ marginTop: '6px' }}>
                      <LikeButton submissionId={item.id} initialCount={item.likeCount ?? 0} initialLiked={item.likedByMe ?? false} />
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
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <LikeButton submissionId={selectedItem.id} initialCount={selectedItem.likeCount ?? 0} initialLiked={selectedItem.likedByMe ?? false} variant="modal" />
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

      {/* 종별 모아보기 상세 모달 */}
      {selectedGroup && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }} onClick={() => setSelectedGroup(null)}>
          <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="glass-panel animate-fade-in-up" style={{ maxWidth: '900px', width: '100%', position: 'relative', padding: '32px', background: 'var(--bg-color)' }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setSelectedGroup(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'var(--primary-light)', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
                <X size={20} />
              </button>
              <div style={{ marginBottom: '24px', textAlign: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '24px' }}>
                <h2 style={{ fontSize: '32px', color: 'var(--primary)', marginBottom: '8px' }}>{selectedGroup}</h2>
                <div style={{ color: 'var(--text-muted)' }}>
                  총 {submissions.filter(s => s.name === selectedGroup).length}번 기록되었습니다
                </div>
              </div>
              <div className="gallery-masonry" style={{ marginTop: '24px' }}>
                {submissions.filter(s => s.name === selectedGroup).map(item => {
                  const urls = JSON.parse(item.mediaUrls || '[]');
                  const mainImg = urls.length > 0 ? urls[0] : null;
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
                      <div className="gallery-info" style={{ padding: '12px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{item.teamName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{item.location}</span>
                          <span>{format(new Date(item.dateTime), 'MM/dd')}</span>
                        </div>
                        <div style={{ marginTop: '6px' }}>
                          <LikeButton submissionId={item.id} initialCount={item.likeCount ?? 0} initialLiked={item.likedByMe ?? false} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
