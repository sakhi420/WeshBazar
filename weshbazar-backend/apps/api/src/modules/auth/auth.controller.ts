/**
 * Auth HTTP surface (spec §17-24).
 *
 * Transport notes:
 * - Browser clients get the refresh token in an HttpOnly cookie scoped to
 *   `/api/v1/auth` (never localStorage). Non-browser clients may pass the
 *   refresh token in the body instead.
 * - Access tokens are returned in the body and used as `Authorization: Bearer`.
 * - Public routes are marked `@Public()`; everything else requires auth.
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../../common/types/authenticated-user';
import type { AppConfig } from '../../config/config.types';
import { AuthService, type AuthOutcome, type ClientContext } from './auth.service';
import {
  AuthResponseDto,
  ChangePhoneResponseDto,
  GenericMessageDto,
  LogoutAllResponseDto,
  MeResponseDto,
  ResendVerificationResponseDto,
  SessionSummaryDto,
  type UserSummaryDto,
} from './dto/auth-responses.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto } from './dto/password.dto';
import { ChangePhoneDto } from './dto/phone.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  /** The refresh cookie is only ever sent to auth endpoints. */
  private static readonly REFRESH_COOKIE_PATH = '/api/v1/auth';

  private readonly cookie: AppConfig['auth']['cookie'];

  constructor(
    private readonly authService: AuthService,
    configService: ConfigService<AppConfig, true>,
  ) {
    this.cookie = configService.get('auth.cookie', { infer: true });
  }

  // --- Registration, sign-in, refresh -------------------------------------------

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Create an account and start phone verification', operationId: 'auth_register' })
  @ApiCreatedResponse({ type: AuthResponseDto })
  async register(
    @Body() dto: RegisterDto,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthOutcome> {
    const outcome = await this.authService.register(dto, this.contextFrom(request));
    this.setRefreshCookie(reply, outcome);
    return outcome;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with phone and password', operationId: 'auth_login' })
  @ApiOkResponse({ type: AuthResponseDto })
  async login(
    @Body() dto: LoginDto,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthOutcome> {
    const outcome = await this.authService.login(dto, this.contextFrom(request));
    this.setRefreshCookie(reply, outcome);
    return outcome;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('refresh-cookie')
  @ApiOperation({
    summary: 'Rotate the refresh session and issue new tokens',
    description:
      'Reads the refresh token from the HttpOnly cookie (browsers) or from the request body (non-browser clients).',
    operationId: 'auth_refresh',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  async refresh(
    @Body() dto: RefreshDto,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthOutcome> {
    const rawToken = this.refreshTokenFrom(request, dto);
    const outcome = await this.authService.refresh(rawToken, this.contextFrom(request));
    this.setRefreshCookie(reply, outcome);
    return outcome;
  }

  // --- Session management ----------------------------------------------------------

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('refresh-cookie')
  @ApiOperation({ summary: 'Revoke the current session', operationId: 'auth_logout' })
  @ApiNoContentResponse()
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    await this.authService.logout(user);
    this.clearRefreshCookie(reply);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('refresh-cookie')
  @ApiOperation({ summary: 'Revoke every session of the account', operationId: 'auth_logoutAll' })
  @ApiOkResponse({ type: LogoutAllResponseDto })
  async logoutAll(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<{ revokedCount: number }> {
    const result = await this.authService.logoutAll(user, this.contextFrom(request));
    this.clearRefreshCookie(reply);
    return result;
  }

  @Get('sessions')
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('refresh-cookie')
  @ApiOperation({ summary: 'List active sessions of the account', operationId: 'auth_listSessions' })
  @ApiOkResponse({ type: SessionSummaryDto, isArray: true })
  listSessions(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.listSessions(user);
  }

  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('refresh-cookie')
  @ApiOperation({ summary: 'Revoke one of the account sessions', operationId: 'auth_revokeSession' })
  @ApiNoContentResponse()
  async revokeSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    const { revokedCurrent } = await this.authService.revokeSession(
      user,
      sessionId,
      this.contextFrom(request),
    );
    if (revokedCurrent) {
      this.clearRefreshCookie(reply);
    }
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Current user and session info', operationId: 'auth_me' })
  @ApiOkResponse({ type: MeResponseDto })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user);
  }

  // --- Phone verification ------------------------------------------------------------

  @Post('verify-phone')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Verify the account phone with the SMS code', operationId: 'auth_verifyPhone' })
  @ApiOkResponse({ type: MeResponseDto })
  verifyPhone(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VerifyCodeDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ user: UserSummaryDto }> {
    return this.authService.verifyPhone(user, dto.code, this.contextFrom(request));
  }

  @Post('verify-phone/resend')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Request a new phone verification code', operationId: 'auth_resendPhoneVerification' })
  @ApiOkResponse({ type: ResendVerificationResponseDto })
  resendPhoneVerification(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ sent: boolean; phoneVerified: boolean; resendAvailableAt: string | null }> {
    return this.authService.resendPhoneVerification(user, this.contextFrom(request));
  }

  // --- Password management ------------------------------------------------------------

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Change the password',
    description: 'Keeps the current session; revokes every other refresh session.',
    operationId: 'auth_changePassword',
  })
  @ApiNoContentResponse()
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    return this.authService.changePassword(user, dto, this.contextFrom(request));
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request a password reset code',
    description: 'Always answers with the same generic message (no account enumeration).',
    operationId: 'auth_forgotPassword',
  })
  @ApiOkResponse({ type: GenericMessageDto })
  forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    return this.authService.forgotPassword(dto, this.contextFrom(request));
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Reset the password with an SMS code',
    description: 'Revokes every refresh session of the account.',
    operationId: 'auth_resetPassword',
  })
  @ApiNoContentResponse()
  resetPassword(
    @Body() dto: ResetPasswordDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    return this.authService.resetPassword(dto, this.contextFrom(request));
  }

  // --- Phone change ---------------------------------------------------------------------

  @Post('change-phone')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Start a phone change',
    description: 'Requires the account password; sends a code to the new number.',
    operationId: 'auth_changePhone',
  })
  @ApiOkResponse({ type: ChangePhoneResponseDto })
  changePhone(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePhoneDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ sent: boolean; newPhone: string; resendAvailableAt: string }> {
    return this.authService.changePhone(user, dto, this.contextFrom(request));
  }

  @Post('change-phone/verify')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Confirm a phone change with the SMS code', operationId: 'auth_verifyPhoneChange' })
  @ApiOkResponse({ type: MeResponseDto })
  verifyPhoneChange(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VerifyCodeDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ user: UserSummaryDto }> {
    return this.authService.verifyPhoneChange(user, dto.code, this.contextFrom(request));
  }

  // --- Helpers -----------------------------------------------------------------------

  private contextFrom(request: AuthenticatedRequest): ClientContext {
    const userAgent = request.headers['user-agent'];
    const deviceName = request.headers['x-device-name'];
    return {
      ip: request.ip,
      userAgent: typeof userAgent === 'string' ? userAgent : undefined,
      deviceName: typeof deviceName === 'string' ? deviceName : undefined,
    };
  }

  private refreshTokenFrom(request: AuthenticatedRequest, dto: RefreshDto): string | undefined {
    const cookies = request.cookies;
    const fromCookie = cookies ? cookies[this.cookie.name] : undefined;
    return fromCookie ?? dto.refreshToken;
  }

  private setRefreshCookie(reply: FastifyReply, outcome: AuthOutcome): void {
    reply.setCookie(this.cookie.name, outcome.tokens.refreshToken, {
      path: AuthController.REFRESH_COOKIE_PATH,
      httpOnly: true,
      secure: this.cookie.secure,
      sameSite: this.cookie.sameSite,
      domain: this.cookie.domain,
      expires: outcome.session.expiresAt,
    });
  }

  private clearRefreshCookie(reply: FastifyReply): void {
    reply.clearCookie(this.cookie.name, { path: AuthController.REFRESH_COOKIE_PATH });
  }
}
