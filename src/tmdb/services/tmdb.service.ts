import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom, map } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class TmdbService {
  private readonly logger = new Logger(TmdbService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.themoviedb.org/3';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('TMDB_API_KEY') as string;
    if (!this.apiKey) {
      this.logger.warn('TMDB_API_KEY is not defined in environment variables');
    }
  }

  async getPopularMovies(page = 1): Promise<any> {
    const url = `${this.baseUrl}/movie/popular`;
    return this.makeRequest(url, { page });
  }

  async getMovieDetails(movieId: number): Promise<any> {
    const url = `${this.baseUrl}/movie/${movieId}`;
    return this.makeRequest(url);
  }

  async searchMovies(query: string, page = 1): Promise<any> {
    const url = `${this.baseUrl}/search/movie`;
    return this.makeRequest(url, { query, page });
  }

  async getMoviesByGenre(genreId: number, page = 1): Promise<any> {
    const url = `${this.baseUrl}/discover/movie`;
    return this.makeRequest(url, { with_genres: genreId, page });
  }

  async getGenres(): Promise<any> {
    const url = `${this.baseUrl}/genre/movie/list`;
    return this.makeRequest(url);
  }

  private async makeRequest(
    url: string,
    params: Record<string, any> = {},
  ): Promise<any> {
    try {
      const { data } = await firstValueFrom(
        this.httpService
          .get(url, {
            params: {
              api_key: this.apiKey,
              ...params,
            },
          })
          .pipe(
            map((response) => response),
            catchError((error: AxiosError) => {
              this.logger.error(`TMDB API error: ${error.message}`);
              throw error;
            }),
          ),
      );
      return data;
    } catch (error) {
      this.logger.error(`Failed to fetch from TMDB: ${error.message}`);
      throw error;
    }
  }
}
