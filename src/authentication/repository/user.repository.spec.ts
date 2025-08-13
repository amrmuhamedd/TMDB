import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRepository } from './user.repository';
import { User, UsersDocument } from '../entities/users.entity';

describe('UserRepository', () => {
  let repository: UserRepository;
  // Using any type to avoid TypeScript errors with Mongoose model mocking
  let model: any;

  // Mock user data
  const mockUserId = 'user123';
  const mockEmail = 'test@example.com';
  const mockUser = {
    _id: { toString: () => mockUserId },
    email: mockEmail,
    password: 'hashedpassword',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(),
    exec: jest.fn(),
  } as unknown as UsersDocument;

  // Create a mock function that can also be used as a constructor
  const mockModelFn = jest.fn();
  
  // Add necessary model methods with proper typing
  const mockModel = mockModelFn as unknown as {
    (): any;
    findOne: jest.Mock;
    findById: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    findByIdAndDelete: jest.Mock;
    select: jest.Mock;
    exec: jest.Mock;
  };
  
  // Add the methods to the mock function
  mockModel.findOne = jest.fn();
  mockModel.findById = jest.fn();
  mockModel.findByIdAndUpdate = jest.fn();
  mockModel.findByIdAndDelete = jest.fn();
  mockModel.select = jest.fn();
  mockModel.exec = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: getModelToken(User.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
    model = module.get(getModelToken(User.name));
    
    // Clear all mock calls
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        email: mockEmail,
        password: 'password123',
        name: 'Test User',
      };

      const mockCreatedUser = {
        ...mockUser,
        save: jest.fn().mockResolvedValue(mockUser),
      };

      // Reset mock for this test
      (model as jest.Mock).mockReturnValue(mockCreatedUser);

      const result = await repository.create(createUserDto);

      expect(model).toHaveBeenCalledWith(createUserDto);
      expect(mockCreatedUser.save).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should throw an error if save fails', async () => {
      const createUserDto = {
        email: mockEmail,
        password: 'password123',
        name: 'Test User',
      };

      const mockError = new Error('Database error');
      const mockCreatedUser = {
        ...mockUser,
        save: jest.fn().mockRejectedValue(mockError),
      };

      // Reset mock for this test
      (model as jest.Mock).mockReturnValue(mockCreatedUser);

      await expect(repository.create(createUserDto))
        .rejects.toThrow('Database error');
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await repository.findByEmail(mockEmail);

      expect(mockModel.findOne).toHaveBeenCalledWith({ email: mockEmail });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found by email', async () => {
      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(mockModel.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find a user by id and exclude password', async () => {
      mockModel.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await repository.findById(mockUserId);

      expect(mockModel.findById).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockUser);
    });

    it('should select method to exclude password field', async () => {
      const selectSpy = jest.fn().mockReturnThis();
      mockModel.findById.mockReturnValue({
        select: selectSpy,
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      await repository.findById(mockUserId);

      expect(selectSpy).toHaveBeenCalledWith('-password');
    });

    it('should return null if user not found by id', async () => {
      mockModel.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.findById('nonexistent');

      expect(mockModel.findById).toHaveBeenCalledWith('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a user by id', async () => {
      const updateData = { name: 'Updated Name' };
      
      const updatedUser = {
        ...mockUser,
        name: 'Updated Name',
      };
      
      mockModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedUser),
      });

      const result = await repository.update(mockUserId, updateData);

      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        updateData,
        { new: true }
      );
      expect(result).toEqual(updatedUser);
    });

    it('should return null if user not found during update', async () => {
      mockModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.update('nonexistent', { name: 'Test' });

      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'nonexistent',
        { name: 'Test' },
        { new: true }
      );
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a user by id', async () => {
      mockModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      await repository.delete(mockUserId);

      expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith(mockUserId);
    });

    it('should handle case when user not found during delete', async () => {
      mockModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Should not throw error
      await expect(repository.delete('nonexistent')).resolves.not.toThrow();
      expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith('nonexistent');
    });
  });
});
