import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../shared/guards/jwtauth.guard'; 
import { RatingsService } from './ratings.service';
import { CreateRatingDto, RatingResponseDto, UpdateRatingDto } from './dto/rating.dto';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('ratings')
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
 
    @ApiBearerAuth()
  @ApiOperation({ summary: 'Rate a movie', description: 'Create or update a rating for a specific movie. If the user has already rated this movie, the rating will be updated.' })
  @ApiResponse({ status: 201, description: 'Rating created/updated successfully', type: RatingResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - User is not logged in' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  async rateMovie(
    @Request() req,
    @Body() createRatingDto: CreateRatingDto,
  ): Promise<RatingResponseDto> {
    return this.ratingsService.rateMovie(req.user.id, createRatingDto);
  }

  @Patch(':movieId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a rating', description: 'Update an existing rating for a specific movie' })
  @ApiParam({ name: 'movieId', description: 'ID of the movie', example: '60d21b4667d0d8992e610c85' })
  @ApiResponse({ status: 200, description: 'Rating updated successfully', type: RatingResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - User is not logged in' })
  @ApiResponse({ status: 404, description: 'Not Found - Rating does not exist' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  async updateRating(
    @Request() req,
    @Param('movieId') movieId: string,
    @Body() updateRatingDto: UpdateRatingDto,
  ): Promise<RatingResponseDto> {
    return this.ratingsService.updateRating(req.user.id, movieId, updateRatingDto);
  }

  @Delete(':movieId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a rating', description: 'Delete a rating for a specific movie' })
  @ApiParam({ name: 'movieId', description: 'ID of the movie', example: '60d21b4667d0d8992e610c85' })
  @ApiResponse({ status: 200, description: 'Rating deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - User is not logged in' })
  @ApiResponse({ status: 404, description: 'Not Found - Rating does not exist' })
  async deleteRating(
    @Request() req,
    @Param('movieId') movieId: string,
  ): Promise<void> {
    return this.ratingsService.deleteRating(req.user.id, movieId);
  }

  @Get('movie/:movieId')
  @ApiOperation({ summary: 'Get all ratings for a movie', description: 'Retrieve all user ratings for a specific movie' })
  @ApiParam({ name: 'movieId', description: 'ID of the movie', example: '60d21b4667d0d8992e610c85' })
  @ApiResponse({ status: 200, description: 'List of ratings returned', type: [RatingResponseDto] })
  async getMovieRatings(
    @Param('movieId') movieId: string,
  ): Promise<RatingResponseDto[]> {
    return this.ratingsService.getMovieRatings(movieId);
  }

  @Get('movie/:movieId/average')
  @ApiOperation({ summary: 'Get average rating for a movie', description: 'Retrieve the average rating and total count of ratings for a specific movie' })
  @ApiParam({ name: 'movieId', description: 'ID of the movie', example: '60d21b4667d0d8992e610c85' })
  @ApiResponse({ 
    status: 200, 
    description: 'Average rating returned', 
    schema: {
      type: 'object',
      properties: {
        average: { type: 'number', example: 8.5, description: 'Average rating value' },
        count: { type: 'integer', example: 42, description: 'Total number of ratings' }
      }
    }
  })
  async getMovieAverageRating(
    @Param('movieId') movieId: string,
  ): Promise<{ average: number; count: number }> {
    return this.ratingsService.getMovieAverageRating(movieId);
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all ratings by the current user', description: 'Retrieve all ratings submitted by the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of user ratings returned', type: [RatingResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized - User is not logged in' })
  async getUserRatings(@Request() req): Promise<RatingResponseDto[]> {
    return this.ratingsService.getUserRatings(req.user.id);
  }

  @Get(':movieId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user rating for a specific movie', description: 'Retrieve the authenticated user\'s rating for a specific movie' })
  @ApiParam({ name: 'movieId', description: 'ID of the movie', example: '60d21b4667d0d8992e610c85' })
  @ApiResponse({ status: 200, description: 'User rating returned', type: RatingResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - User is not logged in' })
  async getUserRating(
    @Request() req,
    @Param('movieId') movieId: string,
  ): Promise<RatingResponseDto | null> {
    return this.ratingsService.getUserRating(req.user.id, movieId);
  }
}
