import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRatingDto {
  @ApiProperty({ description: 'ID of the movie to rate', example: '60d21b4667d0d8992e610c85' })
  @IsNotEmpty()
  @IsMongoId()
  movieId: string;

  @ApiProperty({ description: 'Rating value from 1 to 10', minimum: 1, maximum: 10, example: 8.5 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(10)
  rating: number;

  @ApiPropertyOptional({ description: 'Optional comment about the rating', example: 'Great movie, loved the plot!' })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class UpdateRatingDto {
  @ApiProperty({ description: 'New rating value from 1 to 10', minimum: 1, maximum: 10, example: 9 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(10)
  rating: number;

  @ApiPropertyOptional({ description: 'Updated comment about the rating', example: 'Changed my mind, this movie was even better!' })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class RatingResponseDto {
  @ApiProperty({ description: 'Unique identifier of the rating', example: '60d21b4667d0d8992e610c87' })
  id: string;
  
  @ApiProperty({ description: 'ID of the user who made the rating', example: '60d21b4667d0d8992e610c80' })
  userId: string;
  
  @ApiProperty({ description: 'ID of the rated movie', example: '60d21b4667d0d8992e610c85' })
  movieId: string;
  
  @ApiProperty({ description: 'Rating value from 1 to 10', minimum: 1, maximum: 10, example: 8.5 })
  rating: number;
  
  @ApiPropertyOptional({ description: 'Optional comment about the rating', example: 'Great movie, loved the plot!' })
  comment?: string;
  
  @ApiProperty({ description: 'Date when the rating was created', type: Date })
  createdAt: Date;
  
  @ApiProperty({ description: 'Date when the rating was last updated', type: Date })
  updatedAt: Date;
}
