import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type UsersDocument = User & Document & { _id: Types.ObjectId };

@Schema({ timestamps: true, _id: true })
export class User extends Document {
  @Prop({
    required: true,
    minlength: 3,
  })
  name: string;

  @Prop({
    required: true,
    minlength: 8,
    validate: {
      validator: (value: string) =>
        /[A-Za-z]/.test(value) && // At least one letter
        /\d/.test(value) && // At least one number
        /[!@#$%^&*(),.?":{}|<>]/.test(value), // At least one special character
      message:
        'Password must be at least 8 characters long and include at least one letter, one number, and one special character.',
    },
  })
  password: string;

  @Prop({ required: true, unique: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ })
  email: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
