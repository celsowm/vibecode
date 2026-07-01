import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChargeStatus } from '../common/enums';
import { RegisterPaymentDto } from './dto/register-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async register(dto: RegisterPaymentDto, registeredById: string) {
    const charge = await this.prisma.charge.findUnique({
      where: { id: dto.chargeId },
      include: { payments: true },
    });
    if (!charge) {
      throw new NotFoundException('Cobrança não encontrada');
    }

    const payment = await this.prisma.payment.create({
      data: {
        chargeId: dto.chargeId,
        amountPaid: dto.amountPaid,
        method: dto.method,
        registeredById,
      },
    });

    const totalPaid =
      charge.payments.reduce((sum, p) => sum + Number(p.amountPaid), 0) +
      Number(dto.amountPaid);

    if (totalPaid >= Number(charge.amount)) {
      await this.prisma.charge.update({
        where: { id: charge.id },
        data: { status: ChargeStatus.PAID },
      });
    }

    return payment;
  }

  findByCharge(chargeId: string) {
    return this.prisma.payment.findMany({
      where: { chargeId },
      include: { registeredBy: { select: { id: true, name: true } } },
      orderBy: { paidAt: 'desc' },
    });
  }
}
