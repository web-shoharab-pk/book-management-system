<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">
  <a href="http://nodejs.org" target="_blank"><img src="https://img.shields.io/badge/node-18.x-blue.svg" alt="Node Version" /></a>
  <a href="https://www.mongodb.com" target="_blank"><img src="https://img.shields.io/badge/mongodb-latest-green.svg" alt="MongoDB" /></a>
  <a href="https://www.npmjs.com" target="_blank"><img src="https://img.shields.io/badge/pnpm-package%20manager-orange.svg" alt="Package Manager" /></a>
</p>

## 📚 Book Management System

A robust and scalable **Book Management System** built with **NestJS**, **MongoDB**, and **TypeScript**. This application provides comprehensive RESTful API endpoints for managing authors and books, featuring advanced validation, error handling, pagination, and search capabilities.

### 🚀 Features

- **Author Management**: Full CRUD operations for managing authors with search and pagination
- **Book Management**: Complete book management with ISBN validation and author relationships
- **Advanced Search**: Search authors and books by name, ISBN, or other criteria
- **Pagination**: Efficient pagination for large datasets
- **Data Validation**: Comprehensive input validation using `class-validator` and `class-transformer`
- **Error Handling**: Global exception filter with detailed error messages
- **Database Integration**: MongoDB integration with Mongoose ODM
- **Environment Configuration**: Secure configuration management with validation
- **Type Safety**: Full TypeScript support throughout the application
- **Testing**: E2E tests with MongoDB Memory Server for isolated testing

### 🛠 Tech Stack

- **Framework**: NestJS 11.x
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Validation**: class-validator, class-transformer, Joi
- **Testing**: Jest, Supertest, MongoDB Memory Server
- **Package Manager**: pnpm

### 📋 Prerequisites

- Node.js 18.x or higher
- pnpm (preferred) or npm/yarn
- MongoDB instance (local or remote)

### 🔧 Getting Started

#### 1. Install Dependencies

```bash
pnpm install
```

#### 2. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
NODE_ENV=development
DATABASE_URI=mongodb://localhost:27017/bookdb
PORT=1234
API_PREFIX=api
```

**Note**: Replace `DATABASE_URI` with your MongoDB connection string. For cloud databases like MongoDB Atlas, use the provided connection string.

#### 3. Start the Application

**Development mode** (with hot reload):

```bash
pnpm run start:dev
```

**Production mode**:

```bash
pnpm run build
pnpm run start:prod
```

The application will start on `http://localhost:1234/api` by default.

#### 4. Verify Installation

Once the server is running, you should see:

```
Server is running on port 1234 in development mode
url: http://localhost:1234
```

### 🧪 Testing

#### Run Unit Tests

```bash
pnpm run test
```

#### Run E2E Tests

```bash
pnpm run test:e2e
```

**Note**: E2E tests use MongoDB Memory Server, so no real database connection is required.

#### Generate Test Coverage Report

```bash
pnpm run test:cov
```

Coverage reports will be generated in the `coverage` directory. View the HTML report:

```bash
open coverage/lcov-report/index.html
```

### 📖 API Documentation

Complete API documentation is available on Postman:

🔗 **[View API Documentation](https://documenter.getpostman.com/view/16481716/2sB3Wnx2Tf)**

#### Available Endpoints

**Authors API**

- `POST /api/authors` - Create a new author
- `GET /api/authors` - Get all authors with pagination and search
- `GET /api/authors/:id` - Get author by ID
- `PATCH /api/authors/:id` - Update author
- `DELETE /api/authors/:id` - Delete author

**Books API**

- `POST /api/books` - Create a new book
- `GET /api/books` - Get all books with pagination, search, and author filtering
- `GET /api/books/:id` - Get book by ID (includes author details)
- `PATCH /api/books/:id` - Update book
- `DELETE /api/books/:id` - Delete book

#### Example Request

**Create an Author:**

```bash
curl -X POST http://localhost:1234/api/authors \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Austen",
    "bio": "English novelist known primarily for her six major novels",
    "birthDate": "1775-12-16"
  }'
```

**Create a Book:**

```bash
curl -X POST http://localhost:1234/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pride and Prejudice",
    "isbn": "978-0-14-143951-8",
    "genre": "Fiction",
    "authorId": "<AUTHOR_ID>"
  }'
```

**Search Books:**

```bash
curl "http://localhost:1234/api/books?search=pride&page=1&limit=10"
```

### 🏗 Project Structure

```
src/
├── authors/              # Author module
│   ├── dto/             # Data Transfer Objects
│   ├── entities/        # TypeScript entities
│   ├── schemas/         # Mongoose schemas
│   ├── authors.controller.ts
│   ├── authors.service.ts
│   └── authors.module.ts
├── books/               # Book module
│   ├── dto/
│   ├── entities/
│   ├── schemas/
│   ├── books.controller.ts
│   ├── books.service.ts
│   └── books.module.ts
├── common/              # Shared utilities
│   └── filters/         # Exception filters
├── config/              # Configuration
│   └── configuration.ts # Environment validation
├── app.controller.ts    # Root controller
├── app.service.ts       # Root service
├── app.module.ts        # Root module
└── main.ts              # Application entry point
```

### 🎯 Key Features Explained

#### 1. **Advanced Validation**

- Input validation using decorators (`@IsString`, `@IsNotEmpty`, `@IsISBN`, etc.)
- Automatic request transformation and sanitization
- Detailed validation error messages

#### 2. **Global Exception Handling**

- Centralized error handling with a global exception filter
- Handles Mongoose validation errors, cast errors, and duplicate key errors
- User-friendly error messages with proper HTTP status codes

#### 3. **Pagination & Search**

```typescript
// Query parameters
?page=1&limit=10&search=keyword
```

#### 4. **Data Relationships**

- Books reference authors via MongoDB ObjectId
- Automatic population of author details when fetching books
- Referential integrity validation

#### 5. **Environment Configuration**

- Joi schema validation for environment variables
- Type-safe configuration using ConfigService
- Supports multiple environments (development, production)

### 🚀 Future Improvements

#### 1. **Authentication & Authorization**

- Implement JWT-based authentication
- Role-based access control (RBAC)
- User management system
- Protected API endpoints

#### 2. **Advanced Features**

- File upload for book covers and author photos
- Book ratings and reviews system
- Reading lists and favorites
- Book lending/tracking system
- Multi-language support

#### 3. **Performance Enhancements**

- Redis caching for frequently accessed data
- Database indexing optimization
- GraphQL API alongside REST
- API rate limiting
- Response compression

#### 4. **Monitoring & Logging**

- Structured logging with Winston or Pino
- Integration with monitoring tools (Prometheus, Grafana)
- Health check endpoints
- Request logging middleware
- Error tracking with Sentry

#### 5. **Testing**

- Increase unit test coverage
- Add integration tests for complex workflows
- Performance testing
- Load testing

#### 6. **Documentation**

- OpenAPI/Swagger documentation generation
- API versioning
- Changelog and release notes
- Contributing guidelines

#### 7. **DevOps**

- Docker containerization
- CI/CD pipeline setup
- Automated testing in CI
- Deployment automation
- Blue-green deployment strategy

#### 8. **Data Management**

- Database migrations
- Data seeding scripts
- Backup and restore functionality
- Database replication for high availability

#### 9. **Security Enhancements**

- Helmet.js for security headers
- CORS configuration
- SQL injection prevention (for NoSQL-specific attacks)
- XSS protection
- Input sanitization

#### 10. **Code Quality**

- ESLint and Prettier configuration
- Pre-commit hooks with Husky
- Code review guidelines
- Automated code quality checks

### 📝 Scripts

```bash
# Development
pnpm run start:dev      # Start in watch mode
pnpm run start:debug    # Start in debug mode

# Production
pnpm run build          # Build the application
pnpm run start:prod     # Start in production mode

# Testing
pnpm run test           # Run unit tests
pnpm run test:watch     # Run tests in watch mode
pnpm run test:cov       # Generate coverage report
pnpm run test:e2e       # Run e2e tests

# Code Quality
pnpm run lint           # Run ESLint
pnpm run format         # Format code with Prettier
```

### 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### 📄 License

This project is licensed under the MIT License.

### 🙏 Acknowledgments

- Built with [NestJS](https://nestjs.com)
- MongoDB for data persistence
- Community packages and contributors
