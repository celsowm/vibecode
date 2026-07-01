import { IsOptional, IsString } from 'class-validator';

export class CreateUnitDto {
  @IsString()
  identifier: string;

  @IsOptional()
  @IsString()
  block?: string;

  @IsString()
  number: string;
}
