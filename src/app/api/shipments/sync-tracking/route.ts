import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Shipment from '@/models/Shipment';

export async function POST() {
  try {
    await connectToDatabase();
    
    // Find shipments that are In Transit (no reachedDate) but their expectedReachingDate has passed or is today
    const today = new Date().toISOString().split('T')[0];
    
    const shipmentsToUpdate = await Shipment.find({
      $or: [
        { reachedDate: { $exists: false } },
        { reachedDate: null },
        { reachedDate: '' }
      ],
      expectedReachingDate: { $lte: today, $ne: '' }
    });
    
    let updatedCount = 0;
    
    for (const shipment of shipmentsToUpdate) {
      shipment.reachedDate = shipment.expectedReachingDate;
      await shipment.save();
      updatedCount++;
    }
    
    return NextResponse.json({ message: `Tracking sync complete. ${updatedCount} shipments automatically marked as Delivered.` });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to sync tracking status' }, { status: 500 });
  }
}
