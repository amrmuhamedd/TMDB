import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WatchlistService } from './watchlist.service';
import { JwtAuthGuard } from '../shared/guards/jwtauth.guard';
import { AddToWatchlistDto, RemoveFromWatchlistDto, WatchlistItemResponseDto, WatchlistFilterDto, WatchlistItemWithMovieResponseDto } from './dto/watchlist.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('watchlist')
@Controller('watchlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Post('add')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add a movie to the user watchlist' })
  @ApiBody({ type: AddToWatchlistDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The movie has been added to the watchlist',
    type: WatchlistItemResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Movie not found',
  })
  async addToWatchlist(
    @Request() req,
    @Body() addToWatchlistDto: AddToWatchlistDto,
  ): Promise<WatchlistItemResponseDto> {
    console.log('User from request:', req.user); // Debug log
    return this.watchlistService.addToWatchlist(
      req.user.id,
      addToWatchlistDto.movieId,
    );
  }

  @Delete('remove')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a movie from the user watchlist' })
  @ApiBody({ type: RemoveFromWatchlistDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The movie has been removed from the watchlist',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Movie not found',
  })
  async removeFromWatchlist(
    @Request() req,
    @Body() removeFromWatchlistDto: RemoveFromWatchlistDto,
  ): Promise<{ success: boolean }> {
    const removed = await this.watchlistService.removeFromWatchlist(
      req.user.id,
      removeFromWatchlistDto.movieId,
    );
    return { success: removed };
  }

  @Get()
  @ApiOperation({ summary: 'Get all movies in user watchlist' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all watchlist items with complete movie data for the user',
    type: [WatchlistItemWithMovieResponseDto],
  })
  async getUserWatchlist(
    @Request() req,
    @Query() filterDto: WatchlistFilterDto
  ): Promise<WatchlistItemWithMovieResponseDto[]> {
    console.log('Getting watchlist in controller - user object:', req.user);
    
    // Check if we have userId or id in the user object
    const userId = req.user.userId || req.user.id;
    console.log('Using user ID:', userId);
    
    return this.watchlistService.getUserWatchlist(userId, filterDto);
  }

  @Get('check/:movieId')
  @ApiOperation({ summary: 'Check if a movie is in the user watchlist' })
  @ApiParam({ name: 'movieId', description: 'The ID of the movie to check' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns whether movie is in watchlist',
    schema: {
      type: 'object',
      properties: {
        inWatchlist: {
          type: 'boolean',
          description: 'Whether the movie is in the user watchlist'
        }
      }
    }
  })
  async isInWatchlist(
    @Request() req,
    @Param('movieId') movieId: string,
  ): Promise<{ inWatchlist: boolean }> {
    const inWatchlist = await this.watchlistService.isInWatchlist(req.user.id, movieId);
    return { inWatchlist };
  }
}
