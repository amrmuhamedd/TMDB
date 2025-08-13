import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { User } from '../../authentication/entities/users.entity';
import { Movie } from '../../movie/entities/movie.entity';

export type RatingDocument = Rating & Document  & { _id: Types.ObjectId };;

@Schema({
  timestamps: true,
})
export class Rating {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, autopopulate: true })
  user: User | MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Movie', required: true, autopopulate: true })
  movie: Movie | MongooseSchema.Types.ObjectId;
  
  @Prop({ required: true, min: 1, max: 10 })
  rating: number;
  
  @Prop()
  comment?: string;
}

export const RatingSchema = SchemaFactory.createForClass(Rating);

RatingSchema.index({ user: 1, movie: 1 }, { unique: true });
