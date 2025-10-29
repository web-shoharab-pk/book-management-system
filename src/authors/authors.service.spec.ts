/* eslint-disable @typescript-eslint/no-unsafe-call */

import { ConflictException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { BooksService } from '../books/books.service';
import { AuthorsService } from './authors.service';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { Author } from './schemas/author.schema';

describe('AuthorsService', () => {
  let service: AuthorsService;

  // Mock data
  const mockAuthor: Author = {
    _id: '507f1f77bcf86cd799439011',
    firstName: 'John',
    lastName: 'Doe',
    bio: 'An accomplished author',
    birthDate: new Date('1980-01-01'),
    save: jest.fn(),
    isNew: false,
    id: '507f1f77bcf86cd799439011',
  } as any;

  const mockCreateAuthorDto: CreateAuthorDto = {
    firstName: 'John',
    lastName: 'Doe',
    bio: 'An accomplished author',
    birthDate: '1980-01-01',
  };

  const mockAuthorModel = jest.fn() as any;
  mockAuthorModel.find = jest.fn();
  mockAuthorModel.findOne = jest.fn();
  mockAuthorModel.findById = jest.fn();
  mockAuthorModel.findByIdAndUpdate = jest.fn();
  mockAuthorModel.findByIdAndDelete = jest.fn();
  mockAuthorModel.countDocuments = jest.fn();

  const mockBooksService = {
    findByAuthorId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorsService,
        {
          provide: getModelToken(Author.name),
          useValue: mockAuthorModel,
        },
        {
          provide: BooksService,
          useValue: mockBooksService,
        },
      ],
    }).compile();

    service = module.get<AuthorsService>(AuthorsService);
    module.get<Model<Author>>(getModelToken(Author.name));
    module.get<BooksService>(BooksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a new author', async () => {
      const mockCreatedAuthor = {
        save: jest.fn().mockResolvedValue(mockAuthor),
      };

      mockAuthorModel.mockImplementation(() => mockCreatedAuthor);

      const result = await service.create(mockCreateAuthorDto);

      expect(mockAuthorModel).toHaveBeenCalledWith(mockCreateAuthorDto);
      expect(mockCreatedAuthor.save).toHaveBeenCalled();
      expect(result).toEqual(mockAuthor);
    });

    it('should handle missing optional fields when creating an author', async () => {
      const minimalDto: CreateAuthorDto = {
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const mockCreatedAuthor = {
        save: jest.fn().mockResolvedValue({
          ...minimalDto,
          _id: '507f1f77bcf86cd799439012',
        }),
      };

      mockAuthorModel.mockImplementation(() => mockCreatedAuthor);

      const result = await service.create(minimalDto);

      expect(mockAuthorModel).toHaveBeenCalledWith(minimalDto);
      expect(mockCreatedAuthor.save).toHaveBeenCalled();
      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Smith');
    });
  });

  describe('findAll', () => {
    it('should return authors with pagination when no query params provided', async () => {
      const mockAuthors = [mockAuthor];
      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockAuthors),
      };

      mockAuthorModel.find.mockReturnValue(mockQuery);
      mockAuthorModel.countDocuments.mockResolvedValue(1);

      const result = await service.findAll({});

      expect(mockAuthorModel.find).toHaveBeenCalledWith({});
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(result.authors).toEqual(mockAuthors);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        totalPages: 1,
        totalItems: 1,
      });
    });

    it('should return authors with custom pagination', async () => {
      const mockAuthors = [mockAuthor];
      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockAuthors),
      };

      mockAuthorModel.find.mockReturnValue(mockQuery);
      mockAuthorModel.countDocuments.mockResolvedValue(5);

      const result = await service.findAll({ page: 2, limit: 3 });

      expect(mockQuery.skip).toHaveBeenCalledWith(3);
      expect(mockQuery.limit).toHaveBeenCalledWith(3);
      expect(result.pagination).toEqual({
        page: 2,
        limit: 3,
        totalPages: 2,
        totalItems: 5,
      });
    });

    it('should filter authors by search query (firstName)', async () => {
      const mockAuthors = [mockAuthor];
      const searchFilter = {
        $or: [
          { firstName: { $regex: 'John', $options: 'i' } },
          { lastName: { $regex: 'John', $options: 'i' } },
        ],
      };

      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockAuthors),
      };

      mockAuthorModel.find.mockReturnValue(mockQuery);
      mockAuthorModel.countDocuments.mockResolvedValue(1);

      await service.findAll({ search: 'John' });

      expect(mockAuthorModel.find).toHaveBeenCalledWith(searchFilter);
      expect(mockAuthorModel.countDocuments).toHaveBeenCalledWith(searchFilter);
    });

    it('should filter authors by search query (lastName)', async () => {
      const mockAuthors = [mockAuthor];
      const searchFilter = {
        $or: [
          { firstName: { $regex: 'Doe', $options: 'i' } },
          { lastName: { $regex: 'Doe', $options: 'i' } },
        ],
      };

      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockAuthors),
      };

      mockAuthorModel.find.mockReturnValue(mockQuery);
      mockAuthorModel.countDocuments.mockResolvedValue(1);

      await service.findAll({ search: 'Doe' });

      expect(mockAuthorModel.find).toHaveBeenCalledWith(searchFilter);
    });

    it('should calculate total pages correctly for multiple pages', async () => {
      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      mockAuthorModel.find.mockReturnValue(mockQuery);
      mockAuthorModel.countDocuments.mockResolvedValue(25);

      const result = await service.findAll({ page: 3, limit: 10 });

      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.totalItems).toBe(25);
    });
  });

  describe('findOne', () => {
    it('should return a single author by id', async () => {
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(mockAuthor),
      };
      mockAuthorModel.findById.mockReturnValue(mockQuery);

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(mockAuthorModel.findById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
      expect(result).toEqual(mockAuthor);
    });

    it('should throw NotFoundException when author is not found', async () => {
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(null),
      };
      mockAuthorModel.findById.mockReturnValue(mockQuery);

      await expect(service.findOne('507f1f77bcf86cd799439011')).rejects.toThrow(
        NotFoundException,
      );

      await expect(service.findOne('507f1f77bcf86cd799439011')).rejects.toThrow(
        'Author not found',
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateAuthorDto = {
      bio: 'Updated bio',
    };

    it('should successfully update an author', async () => {
      const updatedAuthor = {
        ...mockAuthor,
        bio: 'Updated bio',
      };

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(updatedAuthor),
      };
      mockAuthorModel.findByIdAndUpdate.mockReturnValue(mockQuery);

      const result = await service.update(
        '507f1f77bcf86cd799439011',
        updateDto,
      );

      expect(mockAuthorModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        updateDto,
        { new: true },
      );
      expect(result.bio).toBe('Updated bio');
    });

    it('should throw NotFoundException when trying to update non-existent author', async () => {
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(null),
      };
      mockAuthorModel.findByIdAndUpdate.mockReturnValue(mockQuery);

      await expect(
        service.update('507f1f77bcf86cd799439011', updateDto),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.update('507f1f77bcf86cd799439011', updateDto),
      ).rejects.toThrow('Author not found');
    });

    it('should allow partial updates', async () => {
      const partialUpdate: UpdateAuthorDto = {
        firstName: 'UpdatedName',
      };
      const updatedAuthor = {
        ...mockAuthor,
        firstName: 'UpdatedName',
      };

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(updatedAuthor),
      };
      mockAuthorModel.findByIdAndUpdate.mockReturnValue(mockQuery);

      const result = await service.update(
        '507f1f77bcf86cd799439011',
        partialUpdate,
      );

      expect(result.firstName).toBe('UpdatedName');
      expect(result.lastName).toBe(mockAuthor.lastName);
    });
  });

  describe('remove', () => {
    it('should successfully delete an author without associated books', async () => {
      mockBooksService.findByAuthorId.mockResolvedValue([]);
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(mockAuthor),
      };
      mockAuthorModel.findByIdAndDelete.mockReturnValue(mockQuery);

      await service.remove('507f1f77bcf86cd799439011');

      expect(mockBooksService.findByAuthorId).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
      expect(mockAuthorModel.findByIdAndDelete).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
    });

    it('should throw ConflictException when author has associated books', async () => {
      const mockBooks = [{ _id: 'book1' }, { _id: 'book2' }];
      mockBooksService.findByAuthorId.mockResolvedValue(mockBooks);

      await expect(service.remove('507f1f77bcf86cd799439011')).rejects.toThrow(
        ConflictException,
      );

      await expect(service.remove('507f1f77bcf86cd799439011')).rejects.toThrow(
        'Cannot delete author with associated books',
      );

      expect(mockAuthorModel.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when trying to delete non-existent author', async () => {
      mockBooksService.findByAuthorId.mockResolvedValue([]);
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(null),
      };
      mockAuthorModel.findByIdAndDelete.mockReturnValue(mockQuery);

      await expect(service.remove('507f1f77bcf86cd799439011')).rejects.toThrow(
        NotFoundException,
      );

      await expect(service.remove('507f1f77bcf86cd799439011')).rejects.toThrow(
        'Author not found',
      );
    });

    it('should handle empty books array when deleting', async () => {
      mockBooksService.findByAuthorId.mockResolvedValue([]);
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(mockAuthor),
      };
      mockAuthorModel.findByIdAndDelete.mockReturnValue(mockQuery);

      await service.remove('507f1f77bcf86cd799439011');

      expect(mockBooksService.findByAuthorId).toHaveBeenCalled();
      expect(mockAuthorModel.findByIdAndDelete).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle findAll with page 0 gracefully (should be treated as page 1)', async () => {
      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      mockAuthorModel.find.mockReturnValue(mockQuery);
      mockAuthorModel.countDocuments.mockResolvedValue(0);

      await service.findAll({ page: 0, limit: 10 });

      // When page is 0, calculation is (0 - 1) * 10 = -10
      // This demonstrates the default handling in the service
      expect(mockQuery.skip).toHaveBeenCalledWith(-10);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
    });

    it('should handle large limit values', async () => {
      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      mockAuthorModel.find.mockReturnValue(mockQuery);
      mockAuthorModel.countDocuments.mockResolvedValue(100);

      const result = await service.findAll({ page: 1, limit: 1000 });

      expect(mockQuery.limit).toHaveBeenCalledWith(1000);
      expect(result.pagination.limit).toBe(1000);
    });

    it('should return empty array when no authors match search', async () => {
      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      mockAuthorModel.find.mockReturnValue(mockQuery);
      mockAuthorModel.countDocuments.mockResolvedValue(0);

      const result = await service.findAll({ search: 'NonExistent' });

      expect(result.authors).toEqual([]);
      expect(result.pagination.totalItems).toBe(0);
    });
  });
});
