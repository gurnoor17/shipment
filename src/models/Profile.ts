import mongoose, { Schema, Document } from 'mongoose';

export interface IProfile extends Document {
  userId: string;
  userName: string;
  companyName: string;
  defaultCategory: string;
}

const ProfileSchema: Schema = new Schema({
  userId: { type: String, required: true, unique: true },
  userName: { type: String, default: 'Admin User' },
  companyName: { type: String, default: 'Danodia Export Desk' },
  defaultCategory: { type: String, default: 'USA' },
});

export default mongoose.models.Profile || mongoose.model<IProfile>('Profile', ProfileSchema);
