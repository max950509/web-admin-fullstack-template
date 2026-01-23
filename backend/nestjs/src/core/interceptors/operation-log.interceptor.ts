import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { catchError, tap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { CHECK_PERMISSIONS_KEY } from '../decorators/check-permissions.decorator';
import { OperationLogService } from '../../modules/operation-log/operation-log.service';
import type { Prisma, User } from '@prisma/client';

const SENSITIVE_FIELDS = new Set([
  'password',
  'otpsecret',
  'loginaccesstoken',
  'accesstoken',
  'refreshtoken',
  'token',
  'authorization',
  'captcha',
  'code',
]);

const maskValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => maskValue(item));
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const masked: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(record)) {
      if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
        masked[key] = '***';
      } else {
        masked[key] = maskValue(item);
      }
    }
    return masked;
  }
  return value;
};

const mapMethodToAction = (method: string): string | undefined => {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'read';
    case 'POST':
      return 'create';
    case 'PUT':
    case 'PATCH':
      return 'update';
    case 'DELETE':
      return 'delete';
    default:
      return undefined;
  }
};

const resolveResource = (request: Request): string | undefined => {
  const baseUrl = request.baseUrl || '';
  const path = baseUrl || request.path || '';
  const normalized = path.replace(/^\//, '').split('/')[0];
  return normalized || undefined;
};

const resolveIp = (request: Request): string | undefined => {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim();
  }
  return request.ip;
};

type RequestWithUser = Request & { user?: User };

@Injectable()
export class OperationLogInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly operationLogService: OperationLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithUser>();
    const response = http.getResponse<Response>();

    const method = request.method || 'UNKNOWN';
    const path = (request.originalUrl || request.url || '').split('?')[0];
    const lowerPath = path.toLowerCase();
    if (
      method.toUpperCase() === 'OPTIONS' ||
      lowerPath.includes('/operation-logs')
    ) {
      return next.handle();
    }

    const metadata = this.reflector.getAllAndOverride<{
      action: string;
      resource: string;
    }>(CHECK_PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    const action = metadata?.action || mapMethodToAction(method);
    const resource = metadata?.resource || resolveResource(request);

    const payload = maskValue({
      params: request.params,
      query: request.query,
      body: request.body as unknown,
    }) as Prisma.InputJsonValue;

    const baseLog = {
      userId: request.user?.id,
      username: request.user?.username,
      action,
      resource,
      method,
      path: request.originalUrl || request.url || '',
      ip: resolveIp(request),
      userAgent:
        typeof request.headers['user-agent'] === 'string'
          ? request.headers['user-agent']
          : undefined,
      payload,
    };

    const writeLog = (statusCode: number) => {
      void this.operationLogService.create({
        ...baseLog,
        statusCode,
      });
    };

    return next.handle().pipe(
      tap(() => {
        writeLog(response.statusCode || 200);
      }),
      catchError((caught: unknown) => {
        const hasStatus =
          typeof caught === 'object' &&
          caught !== null &&
          'getStatus' in caught &&
          typeof (caught as { getStatus: () => number }).getStatus ===
            'function';
        const statusCode = hasStatus
          ? (caught as { getStatus: () => number }).getStatus()
          : response.statusCode || 500;
        writeLog(statusCode);
        return throwError(() => caught);
      }),
    );
  }
}
