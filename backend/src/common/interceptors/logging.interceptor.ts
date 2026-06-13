import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const now = Date.now();

    return next.handle().pipe(
      tap(async (data) => {
        const duration = Date.now() - now;
        const user = (request as any).user;
        
        try {
          await this.prisma.systemLog.create({
            data: {
              userId: user?.id,
              username: user?.username,
              operation: request.method,
              module: request.baseUrl + request.path,
              ipAddress: request.ip,
              userAgent: request.get('user-agent'),
              requestData: JSON.stringify(this.sanitizeData(request.body)),
              responseData: JSON.stringify(this.sanitizeData(data)),
              responseCode: response.statusCode,
              durationMs: duration,
            },
          });
        } catch (error) {
          this.logger.error('Failed to log request', error);
        }

        this.logger.log(
          `${request.method} ${request.url} ${response.statusCode} - ${duration}ms`,
        );
      }),
    );
  }

  private sanitizeData(data: any): any {
    if (!data) return null;
    const sanitized = { ...data };
    if (sanitized.password) delete sanitized.password;
    if (sanitized.passwordHash) delete sanitized.passwordHash;
    if (sanitized.accessToken) delete sanitized.accessToken;
    if (sanitized.refreshToken) delete sanitized.refreshToken;
    return sanitized;
  }
}
