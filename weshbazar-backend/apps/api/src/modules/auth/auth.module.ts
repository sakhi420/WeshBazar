/**
 * Auth feature module.
 *
 * Owns the global authentication pipeline: `JwtAuthGuard` (registered on
 * every route, honoring `@Public()`), `RolesGuard` (honoring `@Roles()`) and
 * `PermissionsGuard` (honoring `@RequirePermissions()`, spec §61).
 * The JWT module is registered as global so other modules can inject
 * `JwtService` without importing this module.
 */
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AppConfig } from '../../config/config.types';
import { SmsModule } from '../../providers/sms/sms.module';
import { AuditModule } from '../audit/audit.module';
import { SellersModule } from '../sellers/sellers.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { TokenService } from './token.service';
import { VerificationService } from './verification.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => ({
        secret: configService.get('auth.accessSecret', { infer: true }),
        signOptions: {
          expiresIn: configService.get('auth.accessTokenExpiresIn', { infer: true }),
        },
      }),
    }),
    SmsModule,
    // Registration provisions the user's personal seller account (spec §25).
    SellersModule,
    // Security events (reuse detection, session revocation, credential
    // changes) write §62 audit rows.
    AuditModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    SessionService,
    VerificationService,
    PasswordService,
    TokenService,
    // Guard order matters: JwtAuthGuard attaches the principal first.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AuthModule {}
