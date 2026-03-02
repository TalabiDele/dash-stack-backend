// src/prisma-client-exception.filter.ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

// This decorator tells NestJS to catch ONLY Prisma Client Known Request Errors
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const message = exception.message.replace(/\n/g, '');

    switch (exception.code) {
      case 'P2002': {
        // P2002 is Prisma's code for "Unique Constraint Violation"
        const status = HttpStatus.CONFLICT;
        response.status(status).json({
          statusCode: status,
          message: `Email already exists`, // Custom message
        });
        break;
      }
      default:
        // default 500 error code
        console.error(exception);
        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
        });
        break;
    }
  }
}
