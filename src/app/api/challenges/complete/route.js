// src/app/api/challenges/complete/route.js
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { completeChallenge } from '@/lib/challenges';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let proofImageUrl = null;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const proofFile = formData.get('proof');

      if (proofFile && proofFile.size > 0) {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });

        const ext = proofFile.name.split('.').pop() || 'jpg';
        const filename = `proof_${authUser.userId}_${Date.now()}.${ext}`;
        const buffer = Buffer.from(await proofFile.arrayBuffer());
        await writeFile(path.join(uploadDir, filename), buffer);
        proofImageUrl = `/uploads/${filename}`;
      }
    }

    const result = await completeChallenge(authUser.userId, proofImageUrl);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('Complete challenge error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
