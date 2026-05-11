import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { submissionIds, password } = await request.json();
    if (password !== 'galdar123') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await prisma.submission.updateMany({
      where: { id: { in: submissionIds } },
      data: { eventId: params.id },
    });

    return NextResponse.json({ updated: submissionIds.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
