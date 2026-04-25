import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Trophy, ChevronLeft, Medal, Award, Crown } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function RankingPage() {
  // 팀명으로 그룹화하여 업로드 개수를 기준으로 내림차순 정렬
  const rankings = await prisma.submission.groupBy({
    by: ['teamName'],
    _count: {
      _all: true,
    },
    orderBy: {
      _count: {
        teamName: 'desc',
      },
    },
  });

  const validRankings = rankings.filter(r => r.teamName && r.teamName.trim() !== '');

  const getMedalIcon = (index: number) => {
    if (index === 0) return <Crown size={28} style={{ color: '#FFD700' }} />; // Gold
    if (index === 1) return <Award size={28} style={{ color: '#C0C0C0' }} />; // Silver
    if (index === 2) return <Award size={28} style={{ color: '#CD7F32' }} />; // Bronze
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
          <div style={{ width: '24px' }}></div> {/* Spacer for centering */}
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '32px' }}>
            가장 많은 생태 기록을 남긴 탐사대입니다!
          </p>

          {validRankings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              아직 기록된 랭킹이 없습니다.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {validRankings.map((ranking, index) => (
                <div 
                  key={ranking.teamName} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    background: index < 3 ? 'var(--primary-light)' : 'rgba(0,0,0,0.02)',
                    color: index < 3 ? 'white' : 'inherit',
                    borderRadius: '16px',
                    boxShadow: index === 0 ? '0 8px 24px rgba(255, 215, 0, 0.2)' : 'none',
                    border: index === 0 ? '2px solid #FFD700' : 'none',
                    transform: index === 0 ? 'scale(1.02)' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '32px', display: 'flex', justifyContent: 'center' }}>
                      {getMedalIcon(index)}
                    </div>
                    <span style={{ fontWeight: 700, fontSize: index === 0 ? '20px' : '18px' }}>
                      {ranking.teamName}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '18px' }}>
                    {ranking._count._all}
                    <span style={{ fontSize: '14px', fontWeight: 400, opacity: 0.8 }}>건</span>
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
    </main>
  );
}
