import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
  const data = await request.formData();
  const files = data.getAll('files') as File[];
  
  if (!files || files.length === 0) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }

  const uploadDir = join(process.cwd(), 'public/uploads');
  
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (e) {
    console.error('Error creating directory', e);
  }

  const fileUrls = [];

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + '-' + file.name.replace(/[^a-zA-Z0-9.-]/g, '');
    const path = join(uploadDir, filename);
    
    await writeFile(path, buffer);
    fileUrls.push(`/uploads/${filename}`);
  }

  return NextResponse.json({ urls: fileUrls });
}
