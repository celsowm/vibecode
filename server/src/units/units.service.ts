import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateUnitDto) {
    return this.prisma.unit.create({ data: dto });
  }

  findAll() {
    return this.prisma.unit.findMany({
      include: {
        residents: {
          where: { endDate: null },
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: [{ block: 'asc' }, { number: 'asc' }],
    });
  }

  async findOne(id: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        residents: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });
    if (!unit) {
      throw new NotFoundException('Unidade não encontrada');
    }
    return unit;
  }

  async update(id: string, dto: UpdateUnitDto) {
    await this.findOne(id);
    return this.prisma.unit.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.unit.delete({ where: { id } });
  }

  async findUnitIdsForUser(userId: string): Promise<string[]> {
    const residents = await this.prisma.resident.findMany({
      where: { userId, endDate: null },
      select: { unitId: true },
    });
    return residents.map((r) => r.unitId);
  }
}
