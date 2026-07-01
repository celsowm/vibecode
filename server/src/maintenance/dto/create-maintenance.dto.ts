import { IsEnum, IsOptional, IsString } from 'class-validator';
import { MaintenancePriority } from '../../common/enums';

export class CreateMaintenanceDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(MaintenancePriority)
  priority?: MaintenancePriority;

  @IsOptional()
  @IsString()
  unitId?: string;
}
