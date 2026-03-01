// src/app/api/challenges/complete/route.js
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { completeChallenge } from '@/lib/challenges';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(request) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let proofImageUrl = null;
    let proofText = null;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      proofText = formData.get('proofText') || null;

      const proofFile = formData.get('proof');
      if (proofFile && proofFile.size > 0) {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(proofFile.type)) {
          return NextResponse.json(
            { error: 'Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed.' },
            { status: 400 }
          );
        }

        // Validate file size (5MB)
        if (proofFile.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { error: 'Image must be under 5MB.' },
            { status: 400 }
          );
        }

        const buffer = Buffer.from(await proofFile.arrayBuffer());
        proofImageUrl = await uploadToCloudinary(buffer, proofFile.name);
      }
    } else {
      const body = await request.json().catch(() => ({}));
      proofText = body.proofText || null;
    }

    // proofText is required
    if (!proofText || proofText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Proof description is required. Please describe how you completed the challenge.' },
        { status: 400 }
      );
    }

    const result = await completeChallenge(authUser.userId, proofImageUrl, proofText.trim());
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('Complete challenge error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}