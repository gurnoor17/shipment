import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Profile from '@/models/Profile';

export async function GET() {
  try {
    await connectToDatabase();
    // Return the first profile or create a default one
    let profile = await Profile.findOne();
    if (!profile) {
      profile = await Profile.create({});
    }
    return NextResponse.json(profile);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    let profile = await Profile.findOne();
    if (!profile) {
      profile = await Profile.create(body);
    } else {
      profile = await Profile.findOneAndUpdate({}, body, { new: true });
    }
    return NextResponse.json(profile);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
