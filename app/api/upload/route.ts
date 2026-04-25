import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const files = data.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const fileUrls = [];

    for (const file of files) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = uniqueSuffix + '-' + file.name.replace(/[^a-zA-Z0-9.-]/g, '');
      
      const blob = await put(filename, file, {
        access: 'public',
      });
      
      fileUrls.push(blob.url);
    }

    return NextResponse.json({ urls: fileUrls });
  } catch (error) {
    console.error('Error uploading to blob:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
