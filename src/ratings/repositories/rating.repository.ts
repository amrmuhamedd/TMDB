import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Rating, RatingDocument } from '../entities/rating.entity';
import { CreateRatingDto } from '../dto/rating.dto';

@Injectable()
export class RatingRepository {
  constructor(
    @InjectModel(Rating.name) private ratingModel: Model<RatingDocument>,
  ) {}

  async create(
    createRatingDto: CreateRatingDto,
    userId: string,
  ): Promise<RatingDocument> {
    const { movieId, ...otherFields } = createRatingDto;
    // Create new rating with proper user and movie IDs
    const newRating = new this.ratingModel({
      user: userId, // Set the user ID properly
      movie: movieId,
      ...otherFields,
    });
    return newRating.save();
  }

  async findById(id: string): Promise<RatingDocument | null> {
    return this.ratingModel.findById(id).exec();
  }

  async findByUserAndMovie(
    userId: string,
    movieId: string,
  ): Promise<RatingDocument | null> {
    return this.ratingModel.findOne({ user: userId, movie: movieId }).exec();
  }

  async findByMovie(movieId: string): Promise<RatingDocument[]> {
    return this.ratingModel.find({ movie: movieId }).exec();
  }

  async findByUser(userId: string): Promise<RatingDocument[]> {
    return this.ratingModel.find({ user: userId }).exec();
  }

  async update(
    userId: string,
    movieId: string,
    rating: number,
    comment?: string,
  ): Promise<RatingDocument> {
    const updateData: any = { rating };
    if (comment !== undefined) {
      updateData.comment = comment;
    }

    return this.ratingModel
      .findOneAndUpdate({ user: userId, movie: movieId }, updateData, {
        new: true,
        upsert: true,
      })
      .exec();
  }

  async delete(userId: string, movieId: string): Promise<boolean> {
    const result = await this.ratingModel
      .deleteOne({ user: userId, movie: movieId })
      .exec();

    return result.deletedCount > 0;
  }

  async calculateAverageRating(
    movieId: string,
  ): Promise<{ average: number; count: number }> {
    try {
      let movieIdQuery;
      try {
        if (movieId.match(/^[0-9a-fA-F]{24}$/)) {
          const mongoose = require('mongoose');
          movieIdQuery = new mongoose.Types.ObjectId(movieId);
        } else {
          movieIdQuery = movieId;
        }
      } catch (error) {
        movieIdQuery = movieId;
      }

      const totalCount = await this.ratingModel.countDocuments({
        movie: movieIdQuery,
      });

      if (totalCount === 0) {
        return { average: 0, count: 0 };
      }

      const result = await this.ratingModel
        .aggregate([
          { $match: { movie: movieIdQuery } },
          {
            $group: {
              _id: null,
              average: { $avg: '$rating' },
              count: { $sum: 1 },
            },
          },
        ])
        .exec();

      if (result.length === 0) {
        return { average: 0, count: totalCount };
      }

      if (result[0].count !== totalCount) {
        console.warn(
          `Aggregation count (${result[0].count}) doesn't match document count (${totalCount}) for movie ${movieId}`,
        );
      }

      return {
        average: result[0].average,
        count: totalCount,
      };
    } catch (error) {
      console.error(`Error calculating average rating: ${error.message}`);
      return { average: 0, count: 0 };
    }
  }
}
