/**
 * Global response interceptor — wraps every successful controller result in
 * the standard success envelope:
 *
 *   { success: true, data, meta?, requestId }
 *
 * Controllers return their payload as-is; when they return a `CursorPaginated`
 * / `PagePaginated` marker, the interceptor unwraps `items` into `data` and
 * promotes `meta`. 204 responses (and raw streamed replies) pass through
 * untouched.
 */
import {
  type CallHandler,
  type ExecutionContext,
  HttpStatus,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { map, type Observable } from 'rxjs';
import { CursorPaginated, PagePaginated } from './pagination';

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta?: unknown;
  requestId: string;
}

/** Kept as a plain number so comparisons with `reply.statusCode` stay safe. */
const HTTP_NO_CONTENT: number = HttpStatus.NO_CONTENT;

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor<unknown, unknown> {
  intercept(context: ExecutionContext, next: CallHandler<unknown>): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<FastifyRequest>();
    const reply = http.getResponse<FastifyReply>();

    const requestId =
      typeof request.id === 'string' && request.id.length > 0 ? request.id : 'unknown';

    return next.handle().pipe(
      map((data) => {
        // 204 No Content must never carry a body.
        if (reply.statusCode === HTTP_NO_CONTENT) {
          return data;
        }

        if (data instanceof CursorPaginated || data instanceof PagePaginated) {
          const envelope: SuccessEnvelope<unknown> = {
            success: true,
            data: data.items,
            meta: data.meta,
            requestId,
          };
          return envelope;
        }

        const envelope: SuccessEnvelope<unknown> = {
          success: true,
          data: data ?? null,
          requestId,
        };
        return envelope;
      }),
    );
  }
}
