import { IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class UpdateResidentDto {
  @IsOptional()
  @IsBoolean()
  isOwner?: boolean;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
