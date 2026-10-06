import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ChangePhoneDto {
  @ApiProperty({ example: 'S3cure!Pass', maxLength: 256, description: 'Current account password.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  password!: string;

  @ApiProperty({ example: '0707654321', maxLength: 32, description: 'New phone number to verify.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  newPhone!: string;
}
