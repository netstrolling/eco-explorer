import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { teamName, dateTime, location, category, name, memo, mediaUrls, lat, lng } = body;

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || null;

    const now = new Date();
    const activeEvent = await prisma.event.findFirst({
      where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } }
    });

    if (!activeEvent && ip) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayCount = await prisma.submission.count({
        where: { uploaderIp: ip, eventId: null, createdAt: { gte: todayStart } }
      });
      if (todayCount >= 10) {
        return NextResponse.json(
          { error: '오늘의 업로드 한도(10건)에 도달했습니다. 내일 다시 시도해 주세요.' },
          { status: 429 }
        );
      }
    }

    const submission = await prisma.submission.create({
      data: {
        teamName,
        dateTime: new Date(dateTime),
        location,
        category,
        name,
        memo,
        mediaUrls: JSON.stringify(mediaUrls || []),
        lat: lat || null,
        lng: lng || null,
        uploaderIp: ip,
        eventId: activeEvent?.id || null,
      }
    });

    return NextResponse.json(submission);
  } catch (error) {
    console.error('Error creating submission:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location');
  const category = searchParams.get('category');
  const admin = searchParams.get('admin');
  const eventId = searchParams.get('eventId');
  const voterId = searchParams.get('voterId');

  const where: Record<string, unknown> = {};
  if (location && location !== 'all') {
    const locs = location.split(',');
    where.location = locs.length > 1 ? { in: locs } : locs[0];
  }
  if (category && category !== 'all') {
    const cats = category.split(',');
    where.category = cats.length > 1 ? { in: cats } : cats[0];
  }
  if (!admin) where.isHidden = false;
  if (eventId) where.eventId = eventId;

  try {
    const submissions = await prisma.submission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        event: { select: { name: true, slug: true } },
        _count: { select: { likes: true } },
        // voterId가 있으면 내가 누른 좋아요만 함께 조회해 likedByMe 계산
        ...(voterId ? { likes: { where: { voterId }, select: { id: true } } } : {}),
      },
    });

    const result = submissions.map((s: any) => {
      const { _count, likes, ...rest } = s;
      return {
        ...rest,
        likeCount: _count?.likes ?? 0,
        likedByMe: voterId ? (likes?.length ?? 0) > 0 : false,
      };
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
