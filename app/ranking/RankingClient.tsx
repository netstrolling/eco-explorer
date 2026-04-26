'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, ChevronLeft, Award, Crown, X } from 'lucide-react';
import { format } from 'date-fns';

type RankingData = {
  teamName: string;
  count: number;
  submissions: any[];
};

export default function RankingClient({ rankings }: { rankings: RankingData[] }) {
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // 모달 열릴 때 배경 스크롤 방지
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

  const getMedalIcon = (index: number) => {
    if (index === 0) return <Crown size={28} style={{ color: '#FFD700' }} />;
    if (index === 1) return <Award size={28} style={{ color: '#C0C0C0' }} />;
    if (index === 2) return <Award size={28} style={{ color: '#CD7F32' }} />;
    return <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--text-muted)', width: '28px', textAlign: 'center' }}>{index + 1}</span>;
  };

  return (
    <main className="wide-container" style={{ paddingBottom: '80px' }}>
      <div className="animate-fade-in-up">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', position: 'relative' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', textDecoration: 'none' }}>
            <ChevronLeft size={24} />
          </Link>
          <h1 style={{ margin: 0, fontSize: '24px', flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Trophy size={28} style={{ color: 'var(--primary)' }} />
            명예의 전당
          </h1>
          <div style={{ width: '24px' }}></div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '32px' }}>
            가장 많은 생태 기록을 남긴 탐사대입니다!
          </p>

          {rankings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              아직 기록된 랭킹이 없습니다.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {rankings.map((ranking, index) => (
                <div 
                  key={ranking.teamName} 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    padding: '20px',
                    background: index < 3 ? 'var(--primary-light)' : 'rgba(0,0,0,0.02)',
                    color: index < 3 ? 'white' : 'inherit',
                    borderRadius: '16px',
                    boxShadow: index === 0 ? '0 8px 24px rgba(255, 215, 0, 0.2)' : 'none',
                    border: index === 0 ? '2px solid #FFD700' : 'none',
                    transform: index === 0 ? 'scale(1.02)' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '32px', display: 'flex', justifyContent: 'center' }}>
                        {getMedalIcon(index)}
                      </div>
                      <span style={{ fontWeight: 700, fontSize: index === 0 ? '20px' : '18px' }}>
                        {ranking.teamName}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '18px' }}>
                      {ranking.count}
                      <span style={{ fontSize: '14px', fontWeight: 400, opacity: 0.8 }}>건</span>
                    </div>
                  </div>

                  {/* 썸네일 가로 스크롤 영역 */}
                  <div className="ranking-scroll" style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    overflowX: 'auto', 
                    paddingBottom: '8px',
                    WebkitOverflowScrolling: 'touch',
                  }}>
                    <style dangerouslySetInnerHTML={{__html: `
                      .ranking-scroll::-webkit-scrollbar { display: none; }
                    `}} />
                    {ranking.submissions.map(sub => {
                      const urls = JSON.parse(sub.mediaUrls || '[]');
                      if (urls.length === 0) return null;
                      return (
                        <div 
                          key={sub.id}
                          onClick={() => setSelectedItem(sub)}
                          style={{
                            flex: '0 0 80px',
                            width: '80px',
                            height: '80px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            position: 'relative',
                            backgroundColor: 'rgba(0,0,0,0.05)'
                          }}
                        >
                          <img 
                            src={urls[0]} 
                            alt={sub.name}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Link href="/gallery" className="btn btn-secondary" style={{ display: 'inline-flex' }}>
            도감 구경하러 가기
          </Link>
        </div>
      </div>

      {/* 상세 모달 */}
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
              style={{ maxWidth: '800px', width: '100%', position: 'relative', padding: '24px', color: 'var(--text)' }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedItem(null)}
                style={{ position: 'absolute', top: '16px', right: '16px', background: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, color: '#333' }}
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
