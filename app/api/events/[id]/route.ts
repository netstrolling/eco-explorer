import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    if (body.password !== 'galdar123') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, slug, startDate, endDate, guidePages, phases, isActive } = body;
    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (slug !== undefined) data.slug = slug;
    if (startDate !== undefined) data.startDate = new Date(startDate);
    if (endDate !== undefined) data.endDate = new Date(endDate);
    if (guidePages !== undefined) data.guidePages = JSON.stringify(guidePages);
    if (phases !== undefined) data.phases = JSON.stringify(phases);
    if (isActive !== undefined) data.isActive = isActive;

    const event = await prisma.event.update({ where: { id: params.id }, data });
    return NextResponse.json(event);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { password } = await request.json();
    if (password !== 'galdar123') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await prisma.event.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
