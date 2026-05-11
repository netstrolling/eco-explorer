import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { password } = await request.json();
    if (password !== 'galdar123') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const event = await prisma.event.findUnique({ where: { id: params.id } });
    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const result = await prisma.submission.updateMany({
      where: {
        dateTime: { gte: event.startDate, lte: event.endDate },
        eventId: null,
      },
      data: { eventId: params.id },
    });

    return NextResponse.json({ updated: result.count });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
