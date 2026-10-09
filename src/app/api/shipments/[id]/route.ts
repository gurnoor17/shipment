import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectToDatabase from '@/lib/mongodb';
import Shipment from '@/models/Shipment';
import { verifyToken } from '@/lib/auth';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = (await cookies()).get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const shipment = await Shipment.findOneAndUpdate({ _id: id, userId: payload.userId }, body, { new: true });
    
    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found or unauthorized' }, { status: 404 });
    }
    return NextResponse.json(shipment);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update shipment' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = (await cookies()).get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const { id } = await params;
    
    // Verify ownership
    const shipment = await Shipment.findOneAndDelete({ _id: id, userId: payload.userId });
    
    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found or unauthorized' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Shipment deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete shipment' }, { status: 500 });
  }
}
