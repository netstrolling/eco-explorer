import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ADMIN_PASSWORD = 'galdar123';

// 권한 확인: 관리자 비밀번호이거나, 본인 글의 editToken이 일치하면 허용
async function authorize(id: string, body: any): Promise<{ ok: boolean; isAdmin: boolean }> {
  if (body?.password === ADMIN_PASSWORD) return { ok: true, isAdmin: true };
  const submission = await prisma.submission.findUnique({
    where: { id },
    select: { editToken: true },
  });
  if (submission?.editToken && body?.editToken && submission.editToken === body.editToken) {
    return { ok: true, isAdmin: false };
  }
  return { ok: false, isAdmin: false };
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json().catch(() => ({}));
    const auth = await authorize(params.id, body);
    if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await prisma.submission.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json().catch(() => ({}));
    const auth = await authorize(params.id, body);
    if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { teamName, location, category, name, memo, isHidden } = body;

    const dataToUpdate: any = {};
    if (teamName !== undefined) dataToUpdate.teamName = teamName;
    if (location !== undefined) dataToUpdate.location = location;
    if (category !== undefined) dataToUpdate.category = category;
    if (name !== undefined) dataToUpdate.name = name;
    if (memo !== undefined) dataToUpdate.memo = memo;
    // isHidden(숨김 처리)은 관리자만 변경 가능
    if (isHidden !== undefined && auth.isAdmin) dataToUpdate.isHidden = isHidden;

    const updated = await prisma.submission.update({
      where: { id: params.id },
      data: dataToUpdate,
    });

    // 응답에서 비밀값 제거
    const { editToken, uploaderIp, ...safe } = updated as any;
    return NextResponse.json(safe);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
