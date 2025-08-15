import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { User } from '../../authentication/entities/users.entity';
import { Movie } from '../../movie/entities/movie.entity';

export type WatchlistDocument = Watchlist & Document & { _id: Types.ObjectId };

@Schema({
  timestamps: true,
  toJSON: {
    transform: function(_, ret: Record<string, any>) {
      ret.id = ret._id;
      ret._id = undefined;
      ret.__v = undefined;
      return ret;
    },
  },
})
export class Watchlist {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, autopopulate: true })
  user: User | MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Movie', required: true, autopopulate: true })
  movie: Movie | MongooseSchema.Types.ObjectId;
  
  @Prop({ default: Date.now })
  createdAt: Date;
  
  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const WatchlistSchema = SchemaFactory.createForClass(Watchlist);

// Create a compound index for uniqueness
WatchlistSchema.index({ user: 1, movie: 1 }, { unique: true });
