import mongoose, { Schema, Document } from 'mongoose';

export interface IProfile extends Document {
  userName: string;
  companyName: string;
  defaultCategory: string;
}

const ProfileSchema: Schema = new Schema({
  userName: { type: String, default: 'Admin User' },
  companyName: { type: String, default: 'Danodia Export Desk' },
  defaultCategory: { type: String, default: 'USA' },
});

export default mongoose.models.Profile || mongoose.model<IProfile>('Profile', ProfileSchema);
