import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'S3cure!Pass', maxLength: 256 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  currentPassword!: string;

  @ApiProperty({ example: 'N3w!Passw0rd', maxLength: 256 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  newPassword!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: '0701234567', maxLength: 32 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  phone!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: '0701234567', maxLength: 32 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  phone!: string;

  @ApiProperty({ example: '483920', description: 'Code from the reset SMS.' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4,10}$/, { message: 'code must be a numeric one-time code' })
  code!: string;

  @ApiProperty({ example: 'N3w!Passw0rd', maxLength: 256 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  newPassword!: string;
}
