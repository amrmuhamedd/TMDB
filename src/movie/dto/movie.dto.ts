import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsArray,
  IsDate,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GenreDto {
  @ApiProperty({ description: 'Genre ID from TMDB' })
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ description: 'Genre name' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CreateMovieDto {
  @ApiProperty({ description: 'TMDB Movie ID' })
  @IsNumber()
  @IsNotEmpty()
  tmdbId: number;

  @ApiProperty({ description: 'Movie title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Movie overview/description' })
  @IsString()
  @IsOptional()
  overview: string;

  @ApiPropertyOptional({ description: 'Poster image path' })
  @IsString()
  @IsOptional()
  posterPath?: string;

  @ApiPropertyOptional({ description: 'Backdrop image path' })
  @IsString()
  @IsOptional()
  backdropPath?: string;

  @ApiPropertyOptional({ description: 'Release date' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  releaseDate?: Date;

  @ApiPropertyOptional({ description: 'Movie genres', type: [GenreDto] })
  @IsArray()
  @IsOptional()
  genres?: GenreDto[];

  @ApiPropertyOptional({ description: 'Movie popularity score' })
  @IsNumber()
  @IsOptional()
  popularity?: number;

  @ApiPropertyOptional({ description: 'Vote count' })
  @IsNumber()
  @IsOptional()
  voteCount?: number;

  @ApiPropertyOptional({ description: 'Average vote score' })
  @IsNumber()
  @IsOptional()
  voteAverage?: number;

  @ApiPropertyOptional({ description: 'Is adult content' })
  @IsBoolean()
  @IsOptional()
  adult?: boolean;
}

export class UpdateMovieDto extends CreateMovieDto {}

export class RateMovieDto {
  @ApiProperty({ description: 'Rating value', minimum: 0.5, maximum: 10 })
  @IsNumber()
  @Min(0.5)
  @Max(10)
  rating: number;
}

export class MovieFilterDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Genre name to filter by' })
  @IsString()
  @IsOptional()
  genre?: string;

  @ApiPropertyOptional({ description: 'Search query' })
  @IsString()
  @IsOptional()
  search?: string;
}

export class MovieResponseDto {
  @ApiProperty({ description: 'Movie ID' })
  id: string;

  @ApiProperty({ description: 'TMDB Movie ID' })
  tmdbId: number;

  @ApiProperty({ description: 'Movie title' })
  title: string;

  @ApiProperty({ description: 'Movie overview/description' })
  overview: string;

  @ApiProperty({ description: 'Poster image path' })
  posterPath: string;

  @ApiProperty({ description: 'Backdrop image path' })
  backdropPath: string;

  @ApiProperty({ description: 'Release date' })
  releaseDate: Date;

  @ApiProperty({ description: 'Movie genres', type: [GenreDto] })
  genres: GenreDto[];

  @ApiProperty({ description: 'Movie popularity score' })
  popularity: number;

  @ApiProperty({ description: 'Vote count' })
  voteCount: number;

  @ApiProperty({ description: 'Average vote score' })
  voteAverage: number;

  @ApiProperty({ description: 'Is adult content' })
  adult: boolean;
}

export class PaginatedMovieResponseDto {
  @ApiProperty({ description: 'List of movies', type: [MovieResponseDto] })
  data: MovieResponseDto[];

  @ApiProperty({ description: 'Total number of movies matching criteria' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;
}
