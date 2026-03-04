import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const avatarFile = formData.get('avatar');

    if (!avatarFile || avatarFile.size === 0) {
      return NextResponse.json({ error: 'Avatar image is required' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(avatarFile.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG and WEBP are allowed.' },
        { status: 400 }
      );
    }

    if (avatarFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be under 5MB.' }, { status: 400 });
    }

    const buffer = Buffer.from(await avatarFile.arrayBuffer());
    const avatarUrl = await uploadToCloudinary(buffer, avatarFile.name, 'streakify/avatars');

    await prisma.user.update({
      where: { id: authUser.userId },
      data: { avatarUrl },
    });

    return NextResponse.json({ success: true, avatarUrl });
  } catch (err) {
    console.error('Avatar upload error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
