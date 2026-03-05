import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, originalUrl, body } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    // Redacted sensitive information from body
    const safeBody = { ...body };
    const sensitiveKeys = [
      'password',
      'token',
      'access_token',
      'refreshToken',
      'secret',
    ];

    sensitiveKeys.forEach((key) => {
      if (safeBody[key]) {
        safeBody[key] = '[REDACTED]';
      }
    });

    response.on('finish', () => {
      const { statusCode } = response;
      const contentLength = response.get('content-length');
      const duration = Date.now() - startTime;

      this.logger.log(
        `${method} ${originalUrl} ${statusCode} ${contentLength} - ${userAgent} ${ip} - ${duration}ms`,
      );

      if (Object.keys(safeBody).length > 0) {
        this.logger.debug(`Request Body: ${JSON.stringify(safeBody)}`);
      }
    });

    next();
  }
}
