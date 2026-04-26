import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let setting = await prisma.systemSetting.findUnique({
      where: { id: 'global' }
    });

    // 만약 세팅이 없다면 기본값으로 생성
    if (!setting) {
      setting = await prisma.systemSetting.create({
        data: { id: 'global', isUploadEnabled: true }
      });
    }

    return NextResponse.json(setting);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { isUploadEnabled, password } = await request.json();

    // 간단한 비밀번호 보호
    if (password !== 'galdar123') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const setting = await prisma.systemSetting.upsert({
      where: { id: 'global' },
      update: { isUploadEnabled },
      create: { id: 'global', isUploadEnabled }
    });

    return NextResponse.json(setting);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
