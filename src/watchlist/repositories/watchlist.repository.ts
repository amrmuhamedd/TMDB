import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Watchlist, WatchlistDocument } from '../entities/watchlist.entity';

@Injectable()
export class WatchlistRepository {
  constructor(
    @InjectModel(Watchlist.name) private watchlistModel: Model<WatchlistDocument>,
  ) {}

  async findByUserAndMovie(userId: string, movieId: string): Promise<WatchlistDocument | null> {
    try {
      // Convert string IDs to ObjectIds
      const userObjectId = new Types.ObjectId(userId);
      const movieObjectId = new Types.ObjectId(movieId);
      
      const result = await this.watchlistModel.findOne({ 
        user: userObjectId, 
        movie: movieObjectId 
      })
        .populate('movie')
        .populate('user')
        .exec();
      
      console.log('Found watchlist item:', result ? 'Yes' : 'No');
      return result;
    } catch (error) {
      console.error('Error in findByUserAndMovie:', error);
      return null;
    }
  }

  async findByUser(userId: string): Promise<WatchlistDocument[]> {
   
    try {
      const userObjectId = new Types.ObjectId(userId);
      const results = await this.watchlistModel.find({ user: userObjectId })
        .sort({ createdAt: -1 })
        .populate('movie')
        .populate('user')
        .exec();
      
    
      return results;
    } catch (error) {
      console.error('Error in findByUser:', error);
      return [];
    }
  }

  async create(userId: string, movieId: string): Promise<WatchlistDocument> {
    
    
    try {
      
      const userObjectId = new Types.ObjectId(userId);
      const movieObjectId = new Types.ObjectId(movieId);
      
      const newWatchlistItem = new this.watchlistModel({
        user: userObjectId,
        movie: movieObjectId
      });
      
      return newWatchlistItem.save();
    } catch (error) {
      console.error('Error creating watchlist item:', error);
      throw error;
    }
  }

  async delete(userId: string, movieId: string): Promise<boolean> {
    try {
      // Convert string IDs to ObjectIds
      const userObjectId = new Types.ObjectId(userId);
      const movieObjectId = new Types.ObjectId(movieId);
      
      const result = await this.watchlistModel.deleteOne({ 
        user: userObjectId, 
        movie: movieObjectId 
      });
      
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error in delete:', error);
      return false;
    }
  }

  async findAllMovieIdsByUser(userId: string): Promise<string[]> {
    try {
      const userObjectId = new Types.ObjectId(userId);
      
      const watchlistItems = await this.watchlistModel.find({ user: userObjectId })
        .select('movie')
        .exec();
      
      console.log(`Found ${watchlistItems.length} movie IDs for user ${userId}`);
      return watchlistItems.map(item => item.movie.toString());
    } catch (error) {
      console.error('Error in findAllMovieIdsByUser:', error);
      return [];
    }
  }
}
