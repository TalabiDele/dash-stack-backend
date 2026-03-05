import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (
        typeof response === 'object' &&
        response !== null &&
        'message' in response
      ) {
        message = (response as Record<string, unknown>).message as string;
      } else if (typeof response === 'string') {
        message = response;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const requestMethod = httpAdapter.getRequestMethod(
      ctx.getRequest(),
    ) as string;
    const requestUrl = httpAdapter.getRequestUrl(ctx.getRequest()) as string;

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: requestUrl,
      message: message,
    };

    // Enhanced logging for errors
    if (httpStatus >= 500) {
      this.logger.error(
        `[${httpStatus}] ${requestMethod} ${requestUrl}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else if (httpStatus === 401) {
      this.logger.warn(
        `[401 Unauthorized] ${requestMethod} ${requestUrl} - Reason: ${message}`,
      );
    } else {
      this.logger.log(`[${httpStatus}] ${requestMethod} ${requestUrl}`);
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
