import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { User } from './users.entity';

export type SessionDocument = Session & Document & { _id: Types.ObjectId };

@Schema({ timestamps: true, _id: true, collection: 'user_sessions' })
export class Session {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({ type: String, required: true })
  token: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
