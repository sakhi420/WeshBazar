import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: '0701234567', maxLength: 32 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  phone!: string;

  @ApiProperty({ example: 'S3cure!Pass', maxLength: 256 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  password!: string;
}
