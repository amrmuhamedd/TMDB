import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Movie, MovieDocument } from '../entities/movie.entity';
import { MovieFilterDto } from '../dto/movie.dto';

@Injectable()
export class MovieRepository {
  constructor(
    @InjectModel(Movie.name) private movieModel: Model<MovieDocument>,
  ) {}

  async create(movie: Partial<Movie>): Promise<MovieDocument> {
    const newMovie = new this.movieModel(movie);
    return newMovie.save();
  }

  async findById(id: string): Promise<MovieDocument | null> {
    return this.movieModel.findById(id).exec();
  }
  
  async findByIds(ids: string[], filters: Record<string, any> = {}): Promise<MovieDocument[]> {
    const query: Record<string, any> = { _id: { $in: ids } };
    
    // Add genre filter if provided
    if (filters.genre) {
      query['genres.name'] = { $regex: new RegExp(filters.genre, 'i') };
    }
    
    return this.movieModel
      .find(query)
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByTmdbId(tmdbId: number): Promise<MovieDocument | null> {
    return this.movieModel.findOne({ tmdbId }).exec();
  }

  async findAll(
    page = 1,
    limit = 10,
    filters: Record<string, any> = {},
  ): Promise<{
    data: MovieDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const data = await this.movieModel
      .find(filters)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();

    const total = await this.movieModel.countDocuments(filters);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  // findByGenre method removed in favor of using findAll with genre name filter

  async search(
    query: string,
    page = 1,
    limit = 10,
  ): Promise<{
    data: MovieDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    const data = await this.movieModel
      .find({ $text: { $search: query } })
      .skip(skip)
      .limit(limit)
      .sort({ score: { $meta: 'textScore' } })
      .exec();

    const total = await this.movieModel.countDocuments({
      $text: { $search: query },
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async update(id: string, movie: Partial<Movie>): Promise<MovieDocument | null> {
    return this.movieModel.findByIdAndUpdate(id, movie, { new: true }).exec();
  }

  async updateByTmdbId(
    tmdbId: number,
    movie: Partial<Movie>,
  ): Promise<MovieDocument> {
    return this.movieModel
      .findOneAndUpdate({ tmdbId }, movie, { new: true, upsert: true })
      .exec();
  }

  async delete(id: string): Promise<MovieDocument | null> {
    return this.movieModel.findByIdAndDelete(id).exec();
  }


}

