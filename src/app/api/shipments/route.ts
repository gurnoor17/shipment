import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectToDatabase from '@/lib/mongodb';
import Shipment from '@/models/Shipment';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  try {
    const token = (await cookies()).get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const shipments = await Shipment.find({ userId: payload.userId }).sort({ createdAt: -1 });
    return NextResponse.json(shipments);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch shipments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = (await cookies()).get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const body = await request.json();
    console.log("CREATING SHIPMENT WITH USER_ID:", payload.userId, typeof payload.userId);
    const shipment = await Shipment.create({ ...body, userId: payload.userId });
    console.log("CREATED SHIPMENT:", shipment);
    return NextResponse.json(shipment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create shipment' }, { status: 500 });
  }
}
