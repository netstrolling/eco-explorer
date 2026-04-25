import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.submission.delete({
      where: { id: params.id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { teamName, location, category, name, memo, isHidden } = body;

    const dataToUpdate: any = {};
    if (teamName !== undefined) dataToUpdate.teamName = teamName;
    if (location !== undefined) dataToUpdate.location = location;
    if (category !== undefined) dataToUpdate.category = category;
    if (name !== undefined) dataToUpdate.name = name;
    if (memo !== undefined) dataToUpdate.memo = memo;
    if (isHidden !== undefined) dataToUpdate.isHidden = isHidden;

    const updated = await prisma.submission.update({
      where: { id: params.id },
      data: dataToUpdate
    });
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
