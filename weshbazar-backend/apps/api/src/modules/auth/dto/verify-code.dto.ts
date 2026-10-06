import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class VerifyCodeDto {
  @ApiProperty({ example: '483920', description: 'Numeric one-time code.' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4,10}$/, { message: 'code must be a numeric one-time code' })
  code!: string;
}
