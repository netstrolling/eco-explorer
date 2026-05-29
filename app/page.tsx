import Link from 'next/link'
import { Leaf, Camera, Trophy, CalendarDays, Library } from 'lucide-react'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic';

export default async function Home() {
  let setting = await prisma.systemSetting.findUnique({ where: { id: 'global' } });
  const isUploadEnabled = setting ? setting.isUploadEnabled : true;
  const activeEvents = await prisma.event.findMany({ where: { isActive: true }, orderBy: { startDate: 'asc' } });

  return (
    <main className="app-container">
      <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>

        {activeEvents.length > 0 && (
          <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeEvents.map((ev: (typeof activeEvents)[number]) => (
              <Link key={ev.id} href={`/events/${ev.slug}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'var(--primary)', color: 'white', borderRadius: '16px', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CalendarDays size={18} />
                    <span style={{ fontWeight: 700, fontSize: '15px' }}>{ev.name}</span>
                    <span style={{ background: 'rgba(255,255,255,0.25)', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>진행중</span>
                  </div>
                  <span style={{ fontSize: '13px', opacity: 0.85 }}>도감 보기 →</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="glass-panel" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div style={{ background: 'var(--primary-light)', padding: '16px', borderRadius: '50%', color: 'white' }}>
              <Leaf size={48} />
            </div>
          </div>
          
          <h1 style={{ fontSize: '28px', marginBottom: '12px' }}>갈다 생태도감</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '16px' }}>
            고흥 우도의 아름다운 생태계를 탐사하고,<br />
            당신이 발견한 생물들을 기록해주세요!
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isUploadEnabled && (
              <Link href="/submit" className="btn btn-primary" style={{ padding: '16px' }}>
                <Camera size={20} />
                기록 시작하기
              </Link>
            )}
            
            <Link href="/events" className="btn btn-secondary" style={{ padding: '16px' }}>
              <CalendarDays size={20} />
              탐사행사 보기
            </Link>

            <Link href="/ranking" className="btn btn-secondary" style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 140, 0, 0.1))', color: '#b8860b', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
              <Trophy size={20} />
              명예의 전당 (랭킹)
            </Link>

            {activeEvents.length > 0 && (
              <Link href={`/events/${activeEvents[0].slug}`} className="btn btn-secondary" style={{ padding: '16px' }}>
                <Library size={20} />
                도감 구경하러 가기
              </Link>
            )}
          </div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-muted)' }}>
          © 2026 Galdar Eco Explorer
        </div>
      </div>
    </main>
  )
}
