import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthorsModule } from './authors/authors.module';
import { BooksModule } from './books/books.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { validationSchema } from './config/configuration';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available everywhere without imports
      envFilePath: `.env`,
      validationSchema, // Joi schema for validation
      validationOptions: {
        allowUnknown: true, // Ignore extra env vars
        abortEarly: false, // Report all errors
      },
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule], // Needed for injection
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('DATABASE_URI'),
      }),
      inject: [ConfigService],
    }),
    // MongooseModule.forRoot('mongodb://localhost:27017/bookdb'), // Replace with your MongoDB URI
    BooksModule,
    AuthorsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
