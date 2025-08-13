import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { MovieService } from './movie.service';
import {
  CreateMovieDto,
  UpdateMovieDto,
  RateMovieDto,
  MovieFilterDto,
  MovieResponseDto,
  PaginatedMovieResponseDto,
} from './dto/movie.dto';
import { JwtAuthGuard } from '../shared/guards/jwtauth.guard'; 

@ApiTags('movies')
@Controller('movies')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  @ApiOperation({ summary: 'Get all movies with filtering options' })
  @ApiResponse({
    status: 200,
    description: 'List of movies',
    type: PaginatedMovieResponseDto,
  })
  async findAll(
    @Query() filterDto: MovieFilterDto,
  ): Promise<PaginatedMovieResponseDto> {
    return this.movieService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a movie by ID' })
  @ApiResponse({
    status: 200,
    description: 'Movie details',
    type: MovieResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async findOne(@Param('id') id: string): Promise<MovieResponseDto> {
    return this.movieService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new movie' })
  @ApiResponse({
    status: 201,
    description: 'Movie created successfully',
    type: MovieResponseDto,
  })
  async create(
    @Body() createMovieDto: CreateMovieDto,
  ): Promise<MovieResponseDto> {
    return this.movieService.create(createMovieDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a movie' })
  @ApiResponse({
    status: 200,
    description: 'Movie updated successfully',
    type: MovieResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async update(
    @Param('id') id: string,
    @Body() updateMovieDto: UpdateMovieDto,
  ): Promise<MovieResponseDto> {
    return this.movieService.update(id, updateMovieDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a movie' })
  @ApiResponse({ status: 200, description: 'Movie deleted successfully' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.movieService.delete(id);
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync movies from TMDB' })
  @ApiResponse({ status: 200, description: 'Movies synced successfully' })
  async syncMovies(): Promise<{ message: string }> {
    await this.movieService.syncPopularMovies();
    return { message: 'Movies synced successfully' };
  }
}
