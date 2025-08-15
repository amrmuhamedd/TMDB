import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Watchlist, WatchlistSchema } from './entities/watchlist.entity';
import { WatchlistController } from './watchlist.controller';
import { WatchlistService } from './watchlist.service';
import { WatchlistRepository } from './repositories/watchlist.repository';
import { MovieRepository } from '../movie/repositories/movie.repository';
import { Movie, MovieSchema } from '../movie/entities/movie.entity';
import { User, UserSchema } from '../authentication/entities/users.entity';
import { RedisModule } from '../cache/redis.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Watchlist.name, schema: WatchlistSchema },
      { name: Movie.name, schema: MovieSchema },
      { name: User.name, schema: UserSchema },
    ]),
    RedisModule,
  ],
  controllers: [WatchlistController],
  providers: [WatchlistService, WatchlistRepository, MovieRepository],
  exports: [WatchlistService],
})
export class WatchlistModule {}
