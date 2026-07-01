import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus, Role } from '../common/enums';
import { AuthenticatedUser } from '../common/types';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBookingDto, user: AuthenticatedUser) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (startsAt >= endsAt) {
      throw new ConflictException('O horário de início deve ser anterior ao término');
    }

    return this.prisma.$transaction(async (tx) => {
      const conflict = await tx.booking.findFirst({
        where: {
          commonAreaId: dto.commonAreaId,
          status: BookingStatus.CONFIRMED,
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt },
        },
      });

      if (conflict) {
        throw new ConflictException('Já existe uma reserva confirmada neste horário para esta área');
      }

      return tx.booking.create({
        data: {
          commonAreaId: dto.commonAreaId,
          createdById: user.userId,
          startsAt,
          endsAt,
          notes: dto.notes,
        },
        include: { commonArea: true, createdBy: { select: { id: true, name: true } } },
      });
    });
  }

  findAll(filters: { commonAreaId?: string; from?: string; to?: string }) {
    const where: Record<string, unknown> = {};
    if (filters.commonAreaId) where.commonAreaId = filters.commonAreaId;
    if (filters.from || filters.to) {
      where.startsAt = {
        ...(filters.from ? { gte: new Date(filters.from) } : {}),
        ...(filters.to ? { lte: new Date(filters.to) } : {}),
      };
    }
    return this.prisma.booking.findMany({
      where,
      include: { commonArea: true, createdBy: { select: { id: true, name: true } } },
      orderBy: { startsAt: 'asc' },
    });
  }

  async cancel(id: string, user: AuthenticatedUser) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      throw new NotFoundException('Reserva não encontrada');
    }
    const canCancel =
      booking.createdById === user.userId || user.role === Role.ADMIN || user.role === Role.SINDICO;
    if (!canCancel) {
      throw new ForbiddenException('Você não pode cancelar esta reserva');
    }
    return this.prisma.booking.update({ where: { id }, data: { status: BookingStatus.CANCELED } });
  }
}
