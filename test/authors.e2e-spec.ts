import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthorsModule } from '../src/authors/authors.module';
import { BooksModule } from '../src/books/books.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';

describe('Authors (e2e)', () => {
  let app: INestApplication<App>;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(mongoUri), AuthorsModule, BooksModule],
      providers: [
        {
          provide: APP_FILTER,
          useClass: GlobalExceptionFilter,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply global validation pipe like in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Set API prefix
    app.setGlobalPrefix('api');

    await app.init();
  }, 60000); // 60 second timeout for MongoDB binary download

  afterAll(async () => {
    await app.close();
    await mongoServer.stop();
  });

  describe('POST /api/authors and GET /api/authors/:id', () => {
    it('should create an author and then retrieve it successfully', async () => {
      // Create an author
      const createAuthorDto = {
        firstName: 'Jane',
        lastName: 'Austen',
        bio: 'English novelist known primarily for her six major novels',
        birthDate: '1775-12-16',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/authors')
        .send(createAuthorDto)
        .expect(201);

      expect(createResponse.body).toHaveProperty('id');
      expect(createResponse.body.firstName).toBe('Jane');
      expect(createResponse.body.lastName).toBe('Austen');
      expect(createResponse.body.bio).toBe(
        'English novelist known primarily for her six major novels',
      );

      const authorId = createResponse.body.id;

      // Retrieve the author by ID
      const getResponse = await request(app.getHttpServer())
        .get(`/api/authors/${authorId}`)
        .expect(200);

      expect(getResponse.body.id).toBe(authorId);
      expect(getResponse.body.firstName).toBe('Jane');
      expect(getResponse.body.lastName).toBe('Austen');
      expect(getResponse.body.bio).toBe(
        'English novelist known primarily for her six major novels',
      );
    });

    it('should create an author with only required fields and retrieve it', async () => {
      // Create an author with minimal data
      const minimalAuthor = {
        firstName: 'Mark',
        lastName: 'Twain',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/authors')
        .send(minimalAuthor)
        .expect(201);

      expect(createResponse.body).toHaveProperty('id');
      expect(createResponse.body.firstName).toBe('Mark');
      expect(createResponse.body.lastName).toBe('Twain');

      const authorId = createResponse.body.id;

      // Retrieve the author
      const getResponse = await request(app.getHttpServer())
        .get(`/api/authors/${authorId}`)
        .expect(200);

      expect(getResponse.body.firstName).toBe('Mark');
      expect(getResponse.body.lastName).toBe('Twain');
      expect(getResponse.body.bio).toBeUndefined();
    });

    it('should fail to create author with missing required fields', async () => {
      const invalidAuthor = {
        lastName: 'Test',
      };

      await request(app.getHttpServer())
        .post('/api/authors')
        .send(invalidAuthor)
        .expect(400);
    });

    it('should return 404 for non-existent author', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app.getHttpServer())
        .get(`/api/authors/${fakeId}`)
        .expect(404);

      expect(response.body.message).toBe('Author not found');
    });
  });
});
