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

    // Handle HttpException (includes class-validator errors)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Handle class-validator errors
      if (
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse
      ) {
        const messages = Array.isArray(exceptionResponse.message)
          ? exceptionResponse.message
          : [exceptionResponse.message];

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
          message: String(messages[0]),
          errors,
          timestamp: new Date().toISOString(),
          path: request.url,
        });
      }

      return response.status(status).json({
        statusCode: status,
        message: exception.message,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
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
      // Format: "property fieldName should be..." or similar
      const fieldMatch = message.match(/^property ([\w]+) should be/);
      const field = fieldMatch ? fieldMatch[1] : 'general';

      return {
        field,
        message,
      };
    });
  }
}
