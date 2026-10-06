import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: '0701234567',
    maxLength: 32,
    description: 'Phone number in local (0…) or international (+93…) format.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  phone!: string;

  @ApiProperty({
    example: 'S3cure!Pass',
    minLength: 8,
    maxLength: 256,
    description: 'Must satisfy the configured password policy.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  password!: string;

  @ApiPropertyOptional({ example: 'Ahmad', minLength: 2, maxLength: 80 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  displayName?: string;
}
