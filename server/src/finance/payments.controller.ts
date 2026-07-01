import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import type { AuthenticatedUser } from '../common/types';
import { RegisterPaymentDto } from './dto/register-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('finance/payments')
@Roles(Role.ADMIN, Role.SINDICO)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post()
  register(
    @Body() dto: RegisterPaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.register(dto, user.userId);
  }

  @Get()
  findByCharge(@Query('chargeId') chargeId: string) {
    return this.paymentsService.findByCharge(chargeId);
  }
}
