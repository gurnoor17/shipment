
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Shipment from '@/models/Shipment';

export async function GET() {
  try {
    await connectToDatabase();

    const shipments = await Shipment.find().sort({ createdAt: -1 });

    return NextResponse.json(shipments);
  } catch (error) {
    console.error('GET /api/shipments failed:', error);

    return NextResponse.json(
      { error: 'Failed to fetch shipments' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const shipment = await Shipment.create(body);

    return NextResponse.json(shipment, { status: 201 });
  } catch (error) {
    console.error('POST /api/shipments failed:', error);

    return NextResponse.json(
      { error: 'Failed to create shipment' },
      { status: 500 }
    );
  }
}