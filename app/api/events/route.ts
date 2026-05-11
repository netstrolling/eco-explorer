import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (slug) {
    const event = await prisma.event.findUnique({ where: { slug } });
    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(event);
  }

  const events = await prisma.event.findMany({ orderBy: { startDate: 'desc' } });
  return NextResponse.json(events);
}

export async function POST(request: Request) {
  try {
    const { name, slug, startDate, endDate, password } = await request.json();
    if (password !== 'galdar123') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const event = await prisma.event.create({
      data: {
        name,
        slug,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        guidePages: JSON.stringify([
          { title: '', content: '' },
          { title: '', content: '' },
          { title: '', content: '' },
        ]),
      }
    });
    return NextResponse.json(event);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
