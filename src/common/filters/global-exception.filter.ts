/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

interface MongooseValidationError {
  name: string;
  errors: {
    [key: string]: {
      name: string;
      message: string;
      kind: string;
      path: string;
      value: any;
    };
  };
  _message: string;
}

interface ValidationError {
  field: string;
  message: string;
}

// Mongo duplicate key error (E11000) shape from MongoServerError/Mongoose
interface MongoDuplicateKeyError {
  code: number; // 11000
  keyPattern?: Record<string, unknown>;
  keyValue?: Record<string, unknown>;
  errmsg?: string;
  errorResponse?: {
    code?: number;
    keyPattern?: Record<string, unknown>;
    keyValue?: Record<string, unknown>;
    errmsg?: string;
  };
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Handle Mongoose ValidationError
    if (this.isMongooseValidationError(exception)) {
      const errors = this.extractMongooseValidationErrors(exception);
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        errors,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    // Handle Mongoose CastError
    if (this.isMongooseCastError(exception)) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid ID format',
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    // Handle Mongo duplicate key (E11000) errors
    if (this.isMongoDuplicateKeyError(exception)) {
      const errors = this.extractMongoDuplicateKeyErrors(exception);
      return response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        message: 'Duplicate key error',
        errors,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    // Handle HttpException (includes class-validator errors)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Handle class-validator errors (only for 400 Bad Request)
      if (
        status === HttpStatus.BAD_REQUEST &&
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse
      ) {
        const errors: ValidationError[] = Array.isArray(
          exceptionResponse.message,
        )
          ? this.transformClassValidatorErrors(
              exceptionResponse.message as string[],
            )
          : [
              {
                field: 'general',
                message: exceptionResponse.message as string,
              },
            ];

        return response.status(status).json({
          statusCode: status,
          message: 'Validation error',
          errors,
          timestamp: new Date().toISOString(),
          path: request.url,
        });
      }

      // Handle standard HTTP exceptions
      const errorResponse: any = {
        statusCode: status,
        message: exception.message,
      };

      // Add error field for standard HTTP status names
      if (status === HttpStatus.NOT_FOUND) {
        errorResponse.error = 'Not Found';
      } else if (status === HttpStatus.BAD_REQUEST) {
        errorResponse.error = 'Bad Request';
      } else if (status === HttpStatus.CONFLICT) {
        errorResponse.error = 'Conflict';
      } else if (status === HttpStatus.UNPROCESSABLE_ENTITY) {
        errorResponse.error = 'Unprocessable Entity';
      }

      return response.status(status).json(errorResponse);
    }

    // Handle other errors
    console.error('Unhandled exception:', exception);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private isMongooseValidationError(
    error: unknown,
  ): error is MongooseValidationError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'ValidationError' &&
      'errors' in error &&
      typeof error.errors === 'object' &&
      error.errors !== null
    );
  }

  private isMongooseCastError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'CastError'
    );
  }

  private extractMongooseValidationErrors(
    error: MongooseValidationError,
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    Object.keys(error.errors).forEach((key) => {
      const fieldError = error.errors[key];
      const fieldName = this.formatFieldName(fieldError.path);

      // Format the error message to be more user-friendly
      const cleanMessage = this.formatErrorMessage(
        fieldError.message,
        fieldError.kind,
        fieldName,
      );

      errors.push({
        field: fieldError.path,
        message: cleanMessage,
      });
    });

    return errors;
  }

  private formatFieldName(fieldName: string): string {
    // Convert camelCase to Title Case
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  private formatErrorMessage(
    message: string,
    kind: string,
    fieldName: string,
  ): string {
    // Replace Mongoose-specific error messages with cleaner ones
    switch (kind) {
      case 'required':
        return `${fieldName} is required.`;
      case 'minlength':
        return `${fieldName} is too short.`;
      case 'maxlength':
        return `${fieldName} is too long.`;
      case 'enum':
        return `${fieldName} has an invalid value.`;
      case 'unique':
        return `${fieldName} must be unique.`;
      default:
        // Remove "Path `fieldName`" prefix from messages
        return (
          message
            .replace(/^Path `[^`]+` /, '')
            .replace(/\.$/, '')
            .trim() + '.'
        );
    }
  }

  private transformClassValidatorErrors(messages: string[]): ValidationError[] {
    return messages.map((message: string) => {
      // Parse class-validator error messages
      // Format: "fieldName must be..." or "fieldName should be..." or "property fieldName should be..."
      // Try multiple patterns to match different class-validator error formats
      const fieldMatch =
        message.match(/^([a-zA-Z_]\w*)\s+(must|should) be/) ||
        message.match(/^property\s+([\w]+)\s+should be/);
      const field = fieldMatch ? fieldMatch[1] : 'general';

      return {
        field,
        message,
      };
    });
  }

  private isMongoDuplicateKeyError(
    error: unknown,
  ): error is MongoDuplicateKeyError {
    if (typeof error !== 'object' || error === null) return false;
    const maybe = error as MongoDuplicateKeyError & { code?: number };
    const rootCode = maybe.code;
    const nestedCode = maybe.errorResponse?.code;
    return rootCode === 11000 || nestedCode === 11000;
  }

  private extractMongoDuplicateKeyErrors(
    error: MongoDuplicateKeyError,
  ): ValidationError[] {
    const keyPattern: Record<string, unknown> =
      error.keyPattern || error.errorResponse?.keyPattern || {};
    const keyValue: Record<string, unknown> =
      error.keyValue || error.errorResponse?.keyValue || {};

    const fields = Object.keys(keyPattern);
    if (fields.length === 0 && error.errmsg) {
      // Fallback: parse field from errmsg like "index: isbn_1 dup key: { isbn: \"value\" }"
      const match = error.errmsg.match(/\{\s*(\w+)\s*:\s*"?([^"}]+)"?\s*\}/);
      if (match) {
        const field = match[1];
        const value = match[2];
        return [
          {
            field,
            message: `${this.formatFieldName(field)} must be unique. Duplicate value: ${value}.`,
          },
        ];
      }
    }

    if (fields.length === 0) {
      return [
        {
          field: 'general',
          message: 'Duplicate value violates a unique constraint.',
        },
      ];
    }

    return fields.map((field) => {
      const value = keyValue[field];
      const renderedValue = (() => {
        if (value === null || value === undefined) return undefined;
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') {
          return String(value);
        }
        try {
          return JSON.stringify(value);
        } catch {
          return '[unserializable]';
        }
      })();
      const valueText = renderedValue
        ? ` Duplicate value: ${renderedValue}.`
        : '';
      return {
        field,
        message: `${this.formatFieldName(field)} must be unique.${valueText}`,
      };
    });
  }
}
