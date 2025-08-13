import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RedisModule } from '../cache/redis.module';
import { Rating, RatingSchema } from './entities/rating.entity';
import { RatingRepository } from './repositories/rating.repository';
import { RatingsService } from './ratings.service';
import { RatingsController } from './ratings.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Rating.name, schema: RatingSchema }]),
    RedisModule,
  ],
  providers: [RatingsService, RatingRepository],
  controllers: [RatingsController],
  exports: [RatingsService],
})
export class RatingsModule {}
