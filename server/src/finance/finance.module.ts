import { Module } from '@nestjs/common';
import { ChargesController } from './charges.controller';
import { ChargesService } from './charges.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  controllers: [ChargesController, PaymentsController],
  providers: [ChargesService, PaymentsService],
})
export class FinanceModule {}
