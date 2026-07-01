import { Injectable, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ChargeStatus, Role } from '../common/enums';
import { AuthenticatedUser } from '../common/types';
import { CreateFeeDto } from './dto/create-fee.dto';

@Injectable()
export class ChargesService {
  constructor(private prisma: PrismaService) {}

  createFee(dto: CreateFeeDto) {
    return this.prisma.fee.create({ data: dto });
  }

  findAllFees() {
    return this.prisma.fee.findMany({ orderBy: [{ referenceYear: 'desc' }, { referenceMonth: 'desc' }] });
  }

  async generateChargesForFee(feeId: string) {
    const fee = await this.prisma.fee.findUnique({ where: { id: feeId } });
    if (!fee) {
      throw new NotFoundException('Taxa não encontrada');
    }

    const units = await this.prisma.unit.findMany({ select: { id: true } });
    const dueDate = new Date(fee.referenceYear, fee.referenceMonth - 1, fee.dueDay);

    const created: string[] = [];
    for (const unit of units) {
      const existing = await this.prisma.charge.findUnique({
        where: { feeId_unitId: { feeId: fee.id, unitId: unit.id } },
      });
      if (existing) continue;

      await this.prisma.charge.create({
        data: {
          feeId: fee.id,
          unitId: unit.id,
          amount: fee.amount,
          dueDate,
          status: ChargeStatus.PENDING,
        },
      });
      created.push(unit.id);
    }

    return { feeId: fee.id, unitsCharged: created.length, totalUnits: units.length };
  }

  async findAll(user: AuthenticatedUser, filters: { status?: ChargeStatus; unitId?: string }) {
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.unitId) where.unitId = filters.unitId;

    if (user.role === Role.MORADOR) {
      const residentUnitIds = (
        await this.prisma.resident.findMany({
          where: { userId: user.userId, endDate: null },
          select: { unitId: true },
        })
      ).map((r) => r.unitId);
      where.unitId = filters.unitId ?? { in: residentUnitIds };
    }

    return this.prisma.charge.findMany({
      where,
      include: { unit: true, fee: true, payments: true },
      orderBy: { dueDate: 'desc' },
    });
  }

  async findOne(id: string, user?: AuthenticatedUser) {
    const charge = await this.prisma.charge.findUnique({
      where: { id },
      include: { unit: true, fee: true, payments: true },
    });
    if (!charge) {
      throw new NotFoundException('Cobrança não encontrada');
    }

    if (user && user.role === Role.MORADOR) {
      const isResident = await this.prisma.resident.findFirst({
        where: { userId: user.userId, unitId: charge.unitId, endDate: null },
      });
      if (!isResident) {
        throw new NotFoundException('Cobrança não encontrada');
      }
    }

    return charge;
  }

  async cancel(id: string) {
    await this.findOne(id);
    return this.prisma.charge.update({ where: { id }, data: { status: ChargeStatus.CANCELED } });
  }

  async delinquencyReport() {
    return this.prisma.charge.findMany({
      where: { status: ChargeStatus.OVERDUE },
      include: { unit: true, fee: true },
      orderBy: { dueDate: 'asc' },
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async markOverdueCharges() {
    const today = new Date();
    await this.prisma.charge.updateMany({
      where: { status: ChargeStatus.PENDING, dueDate: { lt: today } },
      data: { status: ChargeStatus.OVERDUE },
    });
  }
}
