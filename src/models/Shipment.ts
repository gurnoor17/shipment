import mongoose, { Schema, Document } from 'mongoose';

export interface IShipment extends Document {
  userId: string;
  category: string;
  invoiceNo: string;
  dateOfShipment: string;
  noOfBoxes: number;
  totalWeight: number;
  cbm: number;
  fbaId: string;
  sailingDate: string;
  expectedReachingDate: string;
  containerNo: string;
  reachedDate: string;
  pickupDate: string;
  assignedManager: string;
  attachments: { name: string; data: string; mimeType: string }[];
  saved: boolean;
  createdAt: Date;
}

const ShipmentSchema: Schema = new Schema({
  userId: { type: String, required: true },
  category: { type: String, default: 'USA' },
  invoiceNo: { type: String },
  dateOfShipment: { type: String },
  noOfBoxes: { type: Number },
  totalWeight: { type: Number },
  cbm: { type: Number },
  fbaId: { type: String },
  sailingDate: { type: String },
  expectedReachingDate: { type: String },
  containerNo: { type: String },
  reachedDate: { type: String },
  pickupDate: { type: String },
  assignedManager: { type: String, default: 'Unassigned' },
  attachments: [{ name: String, data: String, mimeType: String }],
  saved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Shipment || mongoose.model<IShipment>('Shipment', ShipmentSchema);
