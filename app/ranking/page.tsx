import { prisma } from '@/lib/prisma';
import RankingClient from './RankingClient';

export const dynamic = 'force-dynamic';

export default async function RankingPage() {
  // 모든 사진 데이터를 가져옵니다 (최신순)
  const submissions = await prisma.submission.findMany({
    orderBy: { dateTime: 'desc' }
  });

  // 팀명으로 사진들을 그룹화합니다
  const teamMap = new Map<string, any[]>();
  submissions.forEach(sub => {
    if (!sub.teamName || sub.teamName.trim() === '') return;
    if (!teamMap.has(sub.teamName)) {
      teamMap.set(sub.teamName, []);
    }
    teamMap.get(sub.teamName)!.push(sub);
  });

  // 배열 형태로 변환하고 개수 순으로 내림차순 정렬합니다
  const rankings = Array.from(teamMap.entries()).map(([teamName, subs]) => ({
    teamName,
    count: subs.length,
    submissions: subs,
  })).sort((a, b) => b.count - a.count);

  return <RankingClient rankings={rankings} />;
}
