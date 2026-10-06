/**
 * Health probes.
 *
 *   GET /health/live  — liveness: is the process alive? Never touches the
 *                       database (a database outage must not restart pods).
 *   GET /health/ready — readiness: are critical dependencies reachable?
 *                       Currently the PostgreSQL connection; returns 503
 *                       SERVICE_UNAVAILABLE with per-check details when not.
 *
 * Both endpoints are excluded from the `/api/v1` prefix and marked `@Public`.
 */
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { AppException } from '../../common/errors/app.exception';
import { PrismaService } from '../../database/prisma.service';

interface ComponentHealth {
  status: 'ok' | 'error';
  latencyMs?: number;
  message?: string;
}

interface LivenessBody {
  status: 'ok';
  uptimeSeconds: number;
  timestamp: string;
}

interface ReadinessBody {
  status: 'ok';
  checks: Record<string, ComponentHealth>;
  timestamp: string;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('live')
  @ApiOperation({
    summary: 'Liveness probe',
    description: 'Returns ok while the process is running. Does not check dependencies.',
    operationId: 'health_live',
  })
  live(): LivenessBody {
    return {
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('ready')
  @ApiOperation({
    summary: 'Readiness probe',
    description:
      'Checks critical dependencies (database). Returns 503 with per-check details when a dependency is unavailable.',
    operationId: 'health_ready',
  })
  async ready(): Promise<ReadinessBody> {
    const checks: Record<string, ComponentHealth> = {};

    try {
      checks.database = { status: 'ok', latencyMs: await this.prisma.ping() };
    } catch {
      checks.database = { status: 'error', message: 'Database is not reachable.' };
    }

    const healthy = Object.values(checks).every((check) => check.status === 'ok');
    if (!healthy) {
      throw new AppException('SERVICE_UNAVAILABLE', {
        message: 'One or more critical dependencies are unavailable.',
        details: { checks },
      });
    }

    return { status: 'ok', checks, timestamp: new Date().toISOString() };
  }
}
