import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { MovieResponseDto } from '../../movie/dto/movie.dto';

export class AddToWatchlistDto {
  @ApiProperty({
    description: 'The ID of the movie to add to watchlist',
    example: '60c72b2f9b1d8f001f3b4c39',
  })
  @IsString()
  @IsNotEmpty()
  movieId: string;
}

export class RemoveFromWatchlistDto {
  @ApiProperty({
    description: 'The ID of the movie to remove from watchlist',
    example: '60c72b2f9b1d8f001f3b4c39',
  })
  @IsString()
  @IsNotEmpty()
  movieId: string;
}

export class WatchlistItemResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the watchlist entry',
    example: '60c72b2f9b1d8f001f3b4c39',
  })
  id: string;

  @ApiProperty({
    description: 'User ID who added the movie to watchlist',
    example: '60c72b2f9b1d8f001f3b4c40',
  })
  userId: string;

  @ApiProperty({
    description: 'Movie ID that is in watchlist',
    example: '60c72b2f9b1d8f001f3b4c41',
  })
  movieId: string;

  @ApiProperty({
    description: 'Date when the movie was added to watchlist',
    example: '2023-04-12T15:30:45.123Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date when the watchlist entry was last updated',
    example: '2023-04-12T15:30:45.123Z',
  })
  updatedAt: Date;
}

export class WatchlistFilterDto {
  @ApiPropertyOptional({
    description: 'Filter movies by genre name',
    example: 'Action',
  })
  @IsString()
  @IsOptional()
  genre?: string;
}

export class WatchlistItemWithMovieResponseDto extends WatchlistItemResponseDto {
  @ApiProperty({
    description: 'Full movie data',
    type: () => MovieResponseDto,
  })
  movie: MovieResponseDto;
}
