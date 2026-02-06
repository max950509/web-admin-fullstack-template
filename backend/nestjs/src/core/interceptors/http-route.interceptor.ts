import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PATH_METADATA } from '@nestjs/common/constants';
import type { Request } from 'express';
import type { Observable } from 'rxjs';

type RequestWithRoute = Request & { httpRoute?: string };

const normalizeRoute = (value: string): string => {
  const trimmed = value.replace(/\/+/g, '/');
  if (trimmed === '') {
    return 'unknown';
  }
  if (trimmed === '/') {
    return '/';
  }
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
};

const getRoutePath = (request: Request): string | undefined => {
  const routeValue = (request as { route?: unknown }).route;
  if (!routeValue || typeof routeValue !== 'object') {
    return undefined;
  }
  const pathValue = (routeValue as { path?: unknown }).path;
  return typeof pathValue === 'string' ? pathValue : undefined;
};

@Injectable()
export class HttpRouteInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithRoute>();
    if (!request.httpRoute) {
      const routePath = getRoutePath(request);
      if (typeof routePath === 'string') {
        const baseUrl = request.baseUrl ?? '';
        request.httpRoute = normalizeRoute(`${baseUrl}${routePath}`);
      } else {
        const controllerPath =
          this.reflector.get<string>(PATH_METADATA, context.getClass()) ?? '';
        const handlerPath =
          this.reflector.get<string>(PATH_METADATA, context.getHandler()) ?? '';
        const combined = [controllerPath, handlerPath]
          .filter(Boolean)
          .join('/');
        request.httpRoute = combined
          ? normalizeRoute(`/${combined}`)
          : 'unknown';
      }
    }

    return next.handle();
  }
}
