import { IsEnum } from 'class-validator';
import { MaintenanceStatus } from '../../common/enums';

export class UpdateMaintenanceStatusDto {
  @IsEnum(MaintenanceStatus)
  status: MaintenanceStatus;
}
