import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MovieRepository } from './movie.repository';
import { Movie, MovieDocument } from '../entities/movie.entity';

describe('MovieRepository', () => {
  let repository: MovieRepository;
  let model: any;

  const mockMovieDocument = {
    _id: { toString: () => 'movie123' },
    title: 'Test Movie',
    overview: 'Test overview',
    posterPath: '/path/to/poster.jpg',
    tmdbId: 12345,
    releaseDate: new Date('2023-01-01'),
    genres: [{ id: 28, name: 'Action' }, { id: 18, name: 'Drama' }],
    save: jest.fn(),
    exec: jest.fn(),
  } as unknown as MovieDocument;


  const mockModelFn = jest.fn();
  
  const mockModel = mockModelFn as unknown as {
    (): any;
    findById: jest.Mock;
    findOne: jest.Mock;
    find: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    findOneAndUpdate: jest.Mock;
    findByIdAndDelete: jest.Mock;
    countDocuments: jest.Mock;
    skip: jest.Mock;
    limit: jest.Mock;
    sort: jest.Mock;
    exec: jest.Mock;
  };
  
  mockModel.findById = jest.fn();
  mockModel.findOne = jest.fn();
  mockModel.find = jest.fn();
  mockModel.findByIdAndUpdate = jest.fn();
  mockModel.findOneAndUpdate = jest.fn();
  mockModel.findByIdAndDelete = jest.fn();
  mockModel.countDocuments = jest.fn();
  mockModel.skip = jest.fn();
  mockModel.limit = jest.fn();
  mockModel.sort = jest.fn();
  mockModel.exec = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovieRepository,
        {
          provide: getModelToken(Movie.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    repository = module.get<MovieRepository>(MovieRepository);
    model = module.get(getModelToken(Movie.name));
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new movie', async () => {
      const createMovieDto = {
        title: 'Test Movie',
        overview: 'Test overview',
        posterPath: '/path/to/poster.jpg',
        tmdbId: 12345,
        releaseDate: new Date('2023-01-01'),
        genres: [{ id: 28, name: 'Action' }, { id: 18, name: 'Drama' }],
      };

      const mockCreatedMovie = {
        ...mockMovieDocument,
        save: jest.fn().mockResolvedValue(mockMovieDocument),
      };

      (model as jest.Mock).mockReturnValue(mockCreatedMovie);

      const result = await repository.create(createMovieDto);

      expect(model).toHaveBeenCalledWith(createMovieDto);
      expect(mockCreatedMovie.save).toHaveBeenCalled();
      expect(result).toEqual(mockMovieDocument);
    });
  });

  describe('findById', () => {
    it('should find a movie by id', async () => {
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMovieDocument),
      });

      const result = await repository.findById('movie123');

      expect(model.findById).toHaveBeenCalledWith('movie123');
      expect(result).toEqual(mockMovieDocument);
    });

    it('should return null if movie not found', async () => {
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.findById('notfound');

      expect(model.findById).toHaveBeenCalledWith('notfound');
      expect(result).toBeNull();
    });
  });

  describe('findByIds', () => {
    it('should find movies by array of ids', async () => {
      const mockMovies = [mockMovieDocument, { ...mockMovieDocument, _id: { toString: () => 'movie456' } }];
      
      model.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockMovies),
      });

      const result = await repository.findByIds(['movie123', 'movie456']);

      expect(model.find).toHaveBeenCalledWith({ _id: { $in: ['movie123', 'movie456'] } });
      expect(result).toEqual(mockMovies);
    });

    it('should apply genre filter when provided', async () => {
      const mockMovies = [mockMovieDocument];
      
      model.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockMovies),
      });

      const filters = { genre: 'action' };
      await repository.findByIds(['movie123'], filters);

      expect(model.find).toHaveBeenCalledWith({
        _id: { $in: ['movie123'] },
        'genres.name': { $regex: expect.any(RegExp) }
      });
    });

    it('should return empty array if no movies found', async () => {
      model.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await repository.findByIds(['notfound1', 'notfound2']);

      expect(result).toEqual([]);
    });
  });

  describe('findByTmdbId', () => {
    it('should find a movie by tmdbId', async () => {
      model.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMovieDocument),
      });

      const result = await repository.findByTmdbId(12345);

      expect(model.findOne).toHaveBeenCalledWith({ tmdbId: 12345 });
      expect(result).toEqual(mockMovieDocument);
    });

    it('should return null if movie not found', async () => {
      model.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.findByTmdbId(99999);

      expect(model.findOne).toHaveBeenCalledWith({ tmdbId: 99999 });
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return paginated movies', async () => {
      const mockMovies = [mockMovieDocument, { ...mockMovieDocument, _id: { toString: () => 'movie456' } }];
      const total = 10;
      const page = 2;
      const limit = 2;
      
      model.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockMovies),
      });

      model.countDocuments.mockResolvedValue(total);

      const result = await repository.findAll(page, limit, {});

      expect(model.find).toHaveBeenCalledWith({});
      expect(model.countDocuments).toHaveBeenCalledWith({});
      expect(result).toEqual({
        data: mockMovies,
        total,
        page,
        limit,
      });
    });

    it('should apply filters when provided', async () => {
      const filters = { 'genres.name': 'Action' };
      const mockMovies = [mockMovieDocument];
      
      model.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockMovies),
      });

      model.countDocuments.mockResolvedValue(1);

      await repository.findAll(1, 10, filters);

      expect(model.find).toHaveBeenCalledWith(filters);
      expect(model.countDocuments).toHaveBeenCalledWith(filters);
    });
  });

  describe('search', () => {
    it('should search movies by query', async () => {
      const mockMovies = [mockMovieDocument, { ...mockMovieDocument, _id: { toString: () => 'movie456' } }];
      const query = 'action';
      const total = 2;
      
      model.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockMovies),
      });

      model.countDocuments.mockResolvedValue(total);

      const result = await repository.search(query);

      expect(model.find).toHaveBeenCalledWith({ $text: { $search: query } });
      expect(model.countDocuments).toHaveBeenCalledWith({ $text: { $search: query } });
      expect(result).toEqual({
        data: mockMovies,
        total,
        page: 1,
        limit: 10,
      });
    });

    it('should use pagination parameters when provided', async () => {
      const mockMovies = [mockMovieDocument];
      const query = 'test';
      const page = 3;
      const limit = 5;
      
      model.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockMovies),
      });

      model.countDocuments.mockResolvedValue(15);

      const result = await repository.search(query, page, limit);

      expect(result.page).toBe(page);
      expect(result.limit).toBe(limit);
    });
  });

  describe('update', () => {
    it('should update a movie by id', async () => {
      const updateData = { title: 'Updated Title' };
      
      model.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockMovieDocument,
          title: 'Updated Title',
        }),
      });

      const result = await repository.update('movie123', updateData);

      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
        'movie123',
        updateData,
        { new: true }
      );
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Updated Title');
    });

    it('should return null if movie not found', async () => {
      model.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.update('notfound', { title: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('updateByTmdbId', () => {
    it('should update a movie by tmdbId', async () => {
      const updateData = { title: 'Updated Title' };
      
      model.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockMovieDocument,
          title: 'Updated Title',
        }),
      });

      const result = await repository.updateByTmdbId(12345, updateData);

      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { tmdbId: 12345 },
        updateData,
        { new: true, upsert: true }
      );
      expect(result.title).toBe('Updated Title');
    });
  });

  describe('delete', () => {
    it('should delete a movie by id', async () => {
      model.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMovieDocument),
      });

      const result = await repository.delete('movie123');

      expect(model.findByIdAndDelete).toHaveBeenCalledWith('movie123');
      expect(result).toEqual(mockMovieDocument);
    });

    it('should return null if movie not found', async () => {
      model.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.delete('notfound');

      expect(result).toBeNull();
    });
  });
});
