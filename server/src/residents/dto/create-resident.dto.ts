import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateResidentDto {
  @IsString()
  userId: string;

  @IsString()
  unitId: string;

  @IsOptional()
  @IsBoolean()
  isOwner?: boolean;
}
