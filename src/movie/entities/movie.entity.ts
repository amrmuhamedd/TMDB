import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type MovieDocument = Movie & Document & { _id: Types.ObjectId };

@Schema()
export class Genre {
  @Prop({ required: true })
  id: number;

  @Prop({ required: true })
  name: string;
}

@Schema({ 
  timestamps: true,
 
})
export class Movie {
  @Prop({ required: true })
  tmdbId: number;

  @Prop({ required: true })
  title: string;

  @Prop()
  overview: string;

  @Prop()
  posterPath: string;

  @Prop()
  backdropPath: string;

  @Prop()
  releaseDate: Date;

  @Prop({ type: [{ type: MongooseSchema.Types.Mixed }] })
  genres: Genre[];

  @Prop({ default: 0 })
  popularity: number;

  @Prop({ default: 0 })
  voteCount: number;

  @Prop({ default: 0 })
  voteAverage: number;

  @Prop({ default: false })
  adult: boolean;
}

export const MovieSchema = SchemaFactory.createForClass(Movie);

MovieSchema.index({ title: 'text', overview: 'text' });
MovieSchema.index({ tmdbId: 1 }, { unique: true });
MovieSchema.index({ 'genres.name': 1 });
