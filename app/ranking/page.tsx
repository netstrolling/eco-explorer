import { prisma } from '@/lib/prisma';
import RankingClient from './RankingClient';

export const dynamic = 'force-dynamic';

export default async function RankingPage() {
  // 숨김 처리되지 않은 모든 사진 데이터를 가져옵니다 (최신순)
  const submissions = await prisma.submission.findMany({
    where: { isHidden: false },
    orderBy: { dateTime: 'desc' },
  });

  // 행사 목록 (기간/phase 정보 포함)
  const events = await prisma.event.findMany({
    orderBy: { startDate: 'desc' },
  });

  // 클라이언트로 넘길 형태로 직렬화 (Date -> ISO 문자열)
  const submissionsData = submissions.map(s => ({
    ...s,
    dateTime: s.dateTime.toISOString(),
    createdAt: s.createdAt.toISOString(),
  }));

  const eventsData = events.map(e => ({
    id: e.id,
    name: e.name,
    slug: e.slug,
    isActive: e.isActive,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate.toISOString(),
    phases: e.phases,
  }));

  return <RankingClient submissions={submissionsData} events={eventsData} />;
}
