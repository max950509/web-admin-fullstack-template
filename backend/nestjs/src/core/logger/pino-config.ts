import { randomUUID } from 'crypto';
import ecsFormat from '@elastic/ecs-pino-format';
import type { Request, Response } from 'express';
type RequestWithContext = Request & {
  id?: string;
  requestId?: string;
  startAt?: bigint;
  httpRoute?: string;
  user?: unknown;
};

const buildRequestId = (request: Request): string => {
  const headerValue = request.headers['x-request-id'];
  const fromHeader = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  if (typeof fromHeader === 'string' && fromHeader.trim().length > 0) {
    return fromHeader.trim();
  }
  return randomUUID();
};

const serviceName = process.env.SERVICE_NAME ?? 'backend-nestjs';
const serviceVersion = process.env.SERVICE_VERSION ?? 'dev';
const deploymentEnv =
  process.env.DEPLOYMENT_ENV ?? process.env.NODE_ENV ?? 'development';

const ecsOptions = ecsFormat({ convertReqRes: true });

const getUserSummary = (
  value: unknown,
): { id: number; name: string } | undefined => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const candidate = value as { id?: unknown; username?: unknown };
  if (
    typeof candidate.id !== 'number' ||
    typeof candidate.username !== 'string'
  ) {
    return undefined;
  }
  return { id: candidate.id, name: candidate.username };
};

export const pinoHttpConfig = {
  ...ecsOptions,
  base: {
    ...ecsOptions.base,
    service: { name: serviceName, version: serviceVersion },
    deployment: { environment: deploymentEnv },
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'http.request.headers.authorization',
      'http.request.headers.cookie',
      'req.body.password',
      'req.body.token',
      'req.body.otpSecret',
      'req.body.refreshToken',
    ],
    censor: '***',
  },
  genReqId: (req: RequestWithContext, res: Response) => {
    const requestId = buildRequestId(req);
    req.id = requestId;
    req.requestId = requestId;
    req.startAt = process.hrtime.bigint();
    res.setHeader('x-request-id', requestId);
    return requestId;
  },
  customProps: (req: RequestWithContext, res: Response) => {
    let durationNs: number | undefined;
    if (typeof req.startAt === 'bigint') {
      const ns = process.hrtime.bigint() - req.startAt;
      durationNs =
        ns <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(ns) : undefined;
    }
    const httpRoute =
      typeof req.httpRoute === 'string' && req.httpRoute.length > 0
        ? req.httpRoute
        : 'unknown';
    const dataset =
      httpRoute !== 'unknown' && httpRoute.startsWith('/operation-logs')
        ? 'audit'
        : 'system';
    const userSummary = getUserSummary(req.user as unknown);

    return {
      event: {
        duration: durationNs,
        dataset,
      },
      http: {
        route: httpRoute,
        request: { method: req.method },
        response: { status_code: res.statusCode },
      },
      transaction: { id: req.id },
      labels: { request_id: req.id },
      user: userSummary,
    };
  },
};
