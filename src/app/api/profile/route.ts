import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectToDatabase from '@/lib/mongodb';
import Profile from '@/models/Profile';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  try {
    const token = (await cookies()).get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    let profile = await Profile.findOne({ userId: payload.userId });
    if (!profile) {
      profile = await Profile.create({ userId: payload.userId });
    }
    return NextResponse.json(profile);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const token = (await cookies()).get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const body = await request.json();
    let profile = await Profile.findOne({ userId: payload.userId });
    if (!profile) {
      profile = await Profile.create({ ...body, userId: payload.userId });
    } else {
      profile = await Profile.findOneAndUpdate({ userId: payload.userId }, body, { new: true });
    }
    return NextResponse.json(profile);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
