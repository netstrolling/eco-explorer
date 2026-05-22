import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 좋아요 토글: 이미 눌렀으면 취소, 아니면 추가. 최신 카운트와 내 상태를 반환.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { voterId } = await request.json();
    if (!voterId || typeof voterId !== 'string') {
      return NextResponse.json({ error: 'voterId required' }, { status: 400 });
    }

    const submissionId = params.id;
    const existing = await prisma.like.findUnique({
      where: { submissionId_voterId: { submissionId, voterId } },
    });

    let liked: boolean;
    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      liked = false;
    } else {
      // 기록이 존재하지 않으면 외래키 오류가 나므로 try/catch로 방어
      await prisma.like.create({ data: { submissionId, voterId } });
      liked = true;
    }

    const count = await prisma.like.count({ where: { submissionId } });
    return NextResponse.json({ liked, count });
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
