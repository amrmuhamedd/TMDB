import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { TmdbService } from './tmdb.service';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('TmdbService', () => {
  let service: TmdbService;
  let httpService: HttpService;
  let configService: ConfigService;

  const mockApiKey = 'test-api-key';
  const mockConfigService = {
    get: jest.fn().mockImplementation((key) => {
      if (key === 'TMDB_API_KEY') {
        return mockApiKey;
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        TmdbService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TmdbService>(TmdbService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPopularMovies', () => {
    it('should fetch popular movies successfully', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          results: [
            { id: 1, title: 'Movie 1' },
            { id: 2, title: 'Movie 2' },
          ],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: '' } as any,
      };

      jest.spyOn(httpService, 'get').mockImplementation(() => of(mockResponse));

      const result = await service.getPopularMovies();

      expect(result).toEqual(mockResponse.data);
      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.themoviedb.org/3/movie/popular',
        {
          params: {
            api_key: mockApiKey,
            page: 1,
          },
        },
      );
    });

    it('should handle errors when fetching popular movies', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementation(() => throwError(() => new Error('API Error')));

      await expect(service.getPopularMovies()).rejects.toThrow('API Error');
    });
  });

  describe('getMovieDetails', () => {
    it('should fetch movie details successfully', async () => {
      const mockMovieId = 123;
      const mockResponse: AxiosResponse = {
        data: { id: mockMovieId, title: 'Test Movie', genres: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: '' } as any,
      };

      jest.spyOn(httpService, 'get').mockImplementation(() => of(mockResponse));

      const result = await service.getMovieDetails(mockMovieId);

      expect(result).toEqual(mockResponse.data);
      expect(httpService.get).toHaveBeenCalledWith(
        `https://api.themoviedb.org/3/movie/${mockMovieId}`,
        {
          params: {
            api_key: mockApiKey,
          },
        },
      );
    });
    
    it('should handle errors when fetching movie details', async () => {
      const mockMovieId = 123;
      jest
        .spyOn(httpService, 'get')
        .mockImplementation(() => throwError(() => new Error('Movie API Error')));

      await expect(service.getMovieDetails(mockMovieId)).rejects.toThrow('Movie API Error');
    });
  });

  describe('searchMovies', () => {
    it('should search movies successfully', async () => {
      const mockQuery = 'test';
      const mockResponse: AxiosResponse = {
        data: {
          results: [
            { id: 1, title: 'Test Movie 1' },
            { id: 2, title: 'Test Movie 2' },
          ],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: '' } as any,
      };

      jest.spyOn(httpService, 'get').mockImplementation(() => of(mockResponse));

      const result = await service.searchMovies(mockQuery);

      expect(result).toEqual(mockResponse.data);
      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.themoviedb.org/3/search/movie',
        {
          params: {
            api_key: mockApiKey,
            query: mockQuery,
            page: 1,
          },
        },
      );
    });
    
    it('should handle errors when searching movies', async () => {
      const mockQuery = 'test';
      jest
        .spyOn(httpService, 'get')
        .mockImplementation(() => throwError(() => new Error('Search API Error')));

      await expect(service.searchMovies(mockQuery)).rejects.toThrow('Search API Error');
    });
    
    it('should use custom page parameter when provided', async () => {
      const mockQuery = 'test';
      const mockPage = 3;
      const mockResponse: AxiosResponse = {
        data: { results: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: '' } as any,
      };
      
      jest.spyOn(httpService, 'get').mockImplementation(() => of(mockResponse));
      
      await service.searchMovies(mockQuery, mockPage);
      
      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.themoviedb.org/3/search/movie',
        {
          params: {
            api_key: mockApiKey,
            query: mockQuery,
            page: mockPage,
          },
        },
      );
    });
  });

  describe('getMoviesByGenre', () => {
    it('should fetch movies by genre successfully', async () => {
      const mockGenreId = 28; // Action genre
      const mockResponse: AxiosResponse = {
        data: {
          results: [
            { id: 1, title: 'Action Movie 1' },
            { id: 2, title: 'Action Movie 2' },
          ],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: '' } as any,
      };

      jest.spyOn(httpService, 'get').mockImplementation(() => of(mockResponse));

      const result = await service.getMoviesByGenre(mockGenreId);

      expect(result).toEqual(mockResponse.data);
      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.themoviedb.org/3/discover/movie',
        {
          params: {
            api_key: mockApiKey,
            with_genres: mockGenreId,
            page: 1,
          },
        },
      );
    });
    
    it('should handle errors when fetching movies by genre', async () => {
      const mockGenreId = 28;
      jest
        .spyOn(httpService, 'get')
        .mockImplementation(() => throwError(() => new Error('Genre API Error')));

      await expect(service.getMoviesByGenre(mockGenreId)).rejects.toThrow('Genre API Error');
    });
    
    it('should use custom page parameter when provided', async () => {
      const mockGenreId = 28;
      const mockPage = 2;
      const mockResponse: AxiosResponse = {
        data: { results: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: '' } as any,
      };
      
      jest.spyOn(httpService, 'get').mockImplementation(() => of(mockResponse));
      
      await service.getMoviesByGenre(mockGenreId, mockPage);
      
      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.themoviedb.org/3/discover/movie',
        {
          params: {
            api_key: mockApiKey,
            with_genres: mockGenreId,
            page: mockPage,
          },
        },
      );
    });
  });

  describe('getGenres', () => {
    it('should fetch genres successfully', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          genres: [
            { id: 28, name: 'Action' },
            { id: 12, name: 'Adventure' },
          ],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: '' } as any,
      };

      jest.spyOn(httpService, 'get').mockImplementation(() => of(mockResponse));

      const result = await service.getGenres();

      expect(result).toEqual(mockResponse.data);
      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.themoviedb.org/3/genre/movie/list',
        {
          params: {
            api_key: mockApiKey,
          },
        },
      );
    });
    
    it('should handle errors when fetching genres', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementation(() => throwError(() => new Error('Genres API Error')));

      await expect(service.getGenres()).rejects.toThrow('Genres API Error');
    });
  });

  describe('initialization', () => {
    it('should log warning when API key is not provided', () => {
      // Use Jest mocking to replace the Logger constructor
      const mockLoggerWarn = jest.fn();
      jest.spyOn(Logger.prototype, 'warn').mockImplementation(mockLoggerWarn);
      
      // Mock the config service to return null for API key
      const localConfigMock = {
        get: jest.fn().mockReturnValue(null)
      };

      // Create a new instance with null API key to trigger the warning
      const instance = new TmdbService(httpService, localConfigMock as any);

      expect(localConfigMock.get).toHaveBeenCalledWith('TMDB_API_KEY');
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        'TMDB_API_KEY is not defined in environment variables'
      );
    });
  });
});
