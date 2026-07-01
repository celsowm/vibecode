import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateCommonAreaDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  capacity?: number;

  @IsString()
  openTime: string;

  @IsString()
  closeTime: string;
}
