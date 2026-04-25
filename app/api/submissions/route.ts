import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { teamName, dateTime, location, category, name, memo, mediaUrls, lat, lng } = body;
    
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
  
  const where: any = {};
  if (location && location !== 'all') {
    const locs = location.split(',');
    where.location = locs.length > 1 ? { in: locs } : locs[0];
  }
  if (category && category !== 'all') {
    const cats = category.split(',');
    where.category = cats.length > 1 ? { in: cats } : cats[0];
  }
  if (!admin) where.isHidden = false;
  
  try {
    const submissions = await prisma.submission.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(submissions);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
