import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RedisModule } from '../cache/redis.module';
import { Movie, MovieSchema } from './entities/movie.entity';
import { MovieController } from './movie.controller';
import { MovieService } from './movie.service';
import { MovieRepository } from './repositories/movie.repository';
import { TmdbModule } from '../tmdb/tmdb.module';
import { RatingsModule } from '../ratings/ratings.module';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Movie.name, schema: MovieSchema }]),
    TmdbModule,
    RedisModule,
    RatingsModule,
  ],
  controllers: [MovieController],
  providers: [MovieService, MovieRepository],
  exports: [MovieService],
})
export class MovieModule {}
