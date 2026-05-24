import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 일회성 시간대 보정 도구.
// 과거 폼 버그로 모든 기록의 dateTime이 +9시간(KST 벽시계를 UTC로 저장) 밀려 있어,
// tzFixed=false 인 기록에 한해 dateTime을 9시간 빼고 tzFixed=true로 표시한다.
// tzFixed 플래그 덕분에 중복 실행해도 같은 기록을 두 번 보정하지 않는다.
const SHIFT_MS = 9 * 60 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const { password, mode } = await request.json();
    if (password !== 'galdar123') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targets = await prisma.submission.findMany({
      where: { tzFixed: false },
      select: { id: true, name: true, dateTime: true },
      orderBy: { dateTime: 'desc' },
    });

    const sample = targets.slice(0, 5).map(t => {
      const before = t.dateTime;
      const after = new Date(before.getTime() - SHIFT_MS);
      const toKst = (d: Date) => new Date(d.getTime() + SHIFT_MS).toISOString().replace('T', ' ').slice(0, 16);
      return { name: t.name, beforeKST: toKst(before), afterKST: toKst(after) };
    });

    if (mode !== 'apply') {
      // 미리보기: 아무것도 변경하지 않음
      return NextResponse.json({ mode: 'preview', count: targets.length, sample });
    }

    // 실제 적용
    let updated = 0;
    for (const t of targets) {
      await prisma.submission.update({
        where: { id: t.id },
        data: { dateTime: new Date(t.dateTime.getTime() - SHIFT_MS), tzFixed: true },
      });
      updated++;
    }

    return NextResponse.json({ mode: 'apply', updated, sample });
  } catch (error) {
    console.error('fix-timezone error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
