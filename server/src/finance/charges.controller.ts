import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ChargeStatus, Role } from '../common/enums';
import type { AuthenticatedUser } from '../common/types';
import { ChargesService } from './charges.service';
import { CreateFeeDto } from './dto/create-fee.dto';

@Controller('finance')
export class ChargesController {
  constructor(private chargesService: ChargesService) {}

  @Post('fees')
  @Roles(Role.ADMIN, Role.SINDICO)
  createFee(@Body() dto: CreateFeeDto) {
    return this.chargesService.createFee(dto);
  }

  @Get('fees')
  @Roles(Role.ADMIN, Role.SINDICO)
  findAllFees() {
    return this.chargesService.findAllFees();
  }

  @Post('fees/:id/generate-charges')
  @Roles(Role.ADMIN, Role.SINDICO)
  generateCharges(@Param('id') id: string) {
    return this.chargesService.generateChargesForFee(id);
  }

  @Get('charges')
  findAllCharges(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: ChargeStatus,
    @Query('unitId') unitId?: string,
  ) {
    return this.chargesService.findAll(user, { status, unitId });
  }

  @Get('charges/:id')
  findOneCharge(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.chargesService.findOne(id, user);
  }

  @Patch('charges/:id/cancel')
  @Roles(Role.ADMIN, Role.SINDICO)
  cancelCharge(@Param('id') id: string) {
    return this.chargesService.cancel(id);
  }

  @Get('reports/delinquency')
  @Roles(Role.ADMIN, Role.SINDICO)
  delinquencyReport() {
    return this.chargesService.delinquencyReport();
  }
}
