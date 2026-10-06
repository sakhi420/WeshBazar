/**
 * Global exception filter — the single place where any error escaping the
 * application is converted into the standard error envelope:
 *
 *   { success: false, error: { code, message, details? }, requestId }
 *
 * Resolution order:
 *   1. `AppException`            — code + status straight from the catalog.
 *   2. Prisma known errors       — mapped to domain-appropriate codes.
 *   3. Other Nest `HttpException`s — mapped by status to a generic code.
 *   4. Anything else             — INTERNAL_ERROR, never leaking internals.
 *
 * 5xx causes are logged with the original error (for operators); client
 * errors are logged at warn level without payloads.
 */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Prisma } from '../../generated/prisma/client';
import { AppException, type ErrorResponseBody } from './app.exception';
import { getErrorDefinition, type ErrorCode } from './error-codes';
import { uniqueViolationContext } from './prisma-errors';

interface ResolvedError {
  status: number;
  code: ErrorCode;
  message?: string;
  details?: unknown;
}

/** Statuses at/above this are server errors: cause logged, details hidden. */
const SERVER_ERROR_MIN: number = HttpStatus.INTERNAL_SERVER_ERROR;

const STATUS_TO_CODE: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.METHOD_NOT_ALLOWED]: 'METHOD_NOT_ALLOWED',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'PAYLOAD_TOO_LARGE',
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: 'UNSUPPORTED_MEDIA_TYPE',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
  [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<FastifyRequest>();
    const reply = context.getResponse<FastifyReply>();

    const requestId = this.resolveRequestId(request);
    const resolved = this.resolve(exception);
    const definition = getErrorDefinition(resolved.code);

    const body: ErrorResponseBody = {
      success: false,
      error: {
        code: resolved.code,
        message: resolved.message ?? definition.message,
        ...(resolved.details !== undefined ? { details: resolved.details } : {}),
      },
      requestId,
    };

    const logContext = {
      requestId,
      method: request.method,
      route: request.url,
      statusCode: resolved.status,
      errorCode: resolved.code,
    };
    if (resolved.status >= SERVER_ERROR_MIN) {
      this.logger.error({ ...logContext, err: exception }, `Request failed: ${resolved.code}`);
    } else {
      this.logger.warn(logContext, `Request rejected: ${resolved.code}`);
    }

    reply.header('x-request-id', requestId).status(resolved.status).send(body);
  }

  private resolveRequestId(request: FastifyRequest): string {
    if (typeof request.id === 'string' && request.id.length > 0) {
      return request.id;
    }
    const header = request.headers['x-request-id'];
    if (typeof header === 'string' && header.length > 0) {
      return header;
    }
    return 'unknown';
  }

  private resolve(exception: unknown): ResolvedError {
    if (AppException.isAppException(exception)) {
      return {
        status: exception.status,
        code: exception.code,
        message: exception.message,
        details: exception.details,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.resolvePrismaKnownError(exception);
    }

    if (exception instanceof Prisma.PrismaClientInitializationError) {
      return { status: HttpStatus.SERVICE_UNAVAILABLE, code: 'SERVICE_UNAVAILABLE' };
    }

    if (exception instanceof HttpException) {
      return this.resolveHttpException(exception);
    }

    return { status: HttpStatus.INTERNAL_SERVER_ERROR, code: 'INTERNAL_ERROR' };
  }

  private resolveHttpException(exception: HttpException): ResolvedError {
    const status = exception.getStatus();
    const fallback: ErrorCode = status >= SERVER_ERROR_MIN ? 'INTERNAL_ERROR' : 'BAD_REQUEST';
    const code = STATUS_TO_CODE[status] ?? fallback;

    const response = exception.getResponse();
    let message: string | undefined;
    let details: unknown;
    if (typeof response === 'string') {
      message = response;
    } else if (typeof response === 'object' && response !== null) {
      const body = response as { message?: unknown };
      if (typeof body.message === 'string') {
        message = body.message;
      } else if (Array.isArray(body.message)) {
        // class-validator fallback shape (the global pipe normally prevents
        // this by throwing AppException('VALIDATION_ERROR') with details).
        details = { errors: body.message };
        message = undefined;
      }
    }

    // 5xx HttpExceptions must not leak their message to clients.
    return {
      status,
      code,
      message: status >= SERVER_ERROR_MIN ? undefined : message,
      details: status >= SERVER_ERROR_MIN ? undefined : details,
    };
  }

  private resolvePrismaKnownError(exception: Prisma.PrismaClientKnownRequestError): ResolvedError {
    switch (exception.code) {
      case 'P2000': // value too long for column
        return { status: HttpStatus.BAD_REQUEST, code: 'VALIDATION_ERROR' };
      case 'P2002': {
        // Unique constraint violation — map well-known constraints to
        // specific codes. Note: with driver adapters `meta.target` is empty
        // and the constraint is identified by its index name / model name
        // (see prisma-errors.ts).
        const context = uniqueViolationContext(exception);
        const targets = context?.targets ?? [];
        if (targets.some((target) => target.includes('phoneNormalized'))) {
          return { status: HttpStatus.CONFLICT, code: 'PHONE_ALREADY_REGISTERED' };
        }
        if (
          context?.model === 'SellerAccount' &&
          targets.some((target) => target.includes('slug'))
        ) {
          return { status: HttpStatus.CONFLICT, code: 'SELLER_SLUG_TAKEN' };
        }
        return { status: HttpStatus.CONFLICT, code: 'CONFLICT' };
      }
      case 'P2003': // foreign key constraint failed
        return { status: HttpStatus.UNPROCESSABLE_ENTITY, code: 'UNPROCESSABLE_ENTITY' };
      case 'P2025': // record required by operation not found
        return { status: HttpStatus.NOT_FOUND, code: 'NOT_FOUND' };
      case 'P2034': // transaction conflict (write conflict / deadlock)
        return {
          status: HttpStatus.CONFLICT,
          code: 'CONFLICT',
          message: 'The resource was modified concurrently. Please retry.',
        };
      case 'P1001': // can't reach database server
      case 'P1002': // database server timed out
      case 'P1008': // operation timeout
      case 'P1017': // server closed the connection
      case 'P2024': // connection pool timeout
        return { status: HttpStatus.SERVICE_UNAVAILABLE, code: 'SERVICE_UNAVAILABLE' };
      default:
        return { status: HttpStatus.INTERNAL_SERVER_ERROR, code: 'INTERNAL_ERROR' };
    }
  }
}
