import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { CalendarDays, BookOpen, Library } from 'lucide-react';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const events = await prisma.event.findMany({ orderBy: { startDate: 'desc' } });

  return (
    <main className="app-container">
      <div className="animate-fade-in-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            ←
          </Link>
          <h1 style={{ margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarDays size={24} color="var(--primary)" />
            탐사 행사
          </h1>
        </div>

        {events.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            등록된 행사가 없습니다.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {events.map((ev) => {
              const now = new Date();
              const isOngoing = ev.isActive && new Date(ev.startDate) <= now && new Date(ev.endDate) >= now;
              const isPast = new Date(ev.endDate) < now;

              return (
                <div key={ev.id} className="glass-panel" style={{ padding: '20px 24px', borderLeft: ev.isActive ? '4px solid var(--primary)' : '4px solid transparent' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: '18px', margin: 0 }}>{ev.name}</h2>
                        {isOngoing && (
                          <span style={{ background: 'var(--primary)', color: 'white', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px' }}>진행중</span>
                        )}
                        {isPast && (
                          <span style={{ background: '#e9ecef', color: '#6c757d', fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px' }}>종료</span>
                        )}
                        {!isOngoing && !isPast && (
                          <span style={{ background: 'rgba(13,110,253,0.1)', color: 'var(--primary)', fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px' }}>예정</span>
                        )}
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                        {format(new Date(ev.startDate), 'yyyy.MM.dd')} ~ {format(new Date(ev.endDate), 'yyyy.MM.dd')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <Link href={`/events/${ev.slug}/guide`} className="btn btn-secondary" style={{ width: 'auto', padding: '8px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <BookOpen size={14} /> 안내
                      </Link>
                      <Link href={`/events/${ev.slug}`} className="btn btn-primary" style={{ width: 'auto', padding: '8px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Library size={14} /> 도감 보기
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
