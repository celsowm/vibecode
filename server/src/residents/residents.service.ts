import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResidentDto } from './dto/create-resident.dto';
import { UpdateResidentDto } from './dto/update-resident.dto';

const RESIDENT_INCLUDE = {
  user: { select: { id: true, name: true, email: true } },
  unit: true,
};

@Injectable()
export class ResidentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateResidentDto) {
    const existing = await this.prisma.resident.findUnique({
      where: { userId_unitId: { userId: dto.userId, unitId: dto.unitId } },
    });
    if (existing) {
      throw new ConflictException(
        'Este morador já está vinculado a esta unidade',
      );
    }
    return this.prisma.resident.create({
      data: {
        userId: dto.userId,
        unitId: dto.unitId,
        isOwner: dto.isOwner ?? false,
      },
      include: RESIDENT_INCLUDE,
    });
  }

  findAll(unitId?: string) {
    return this.prisma.resident.findMany({
      where: unitId ? { unitId } : undefined,
      include: RESIDENT_INCLUDE,
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const resident = await this.prisma.resident.findUnique({
      where: { id },
      include: RESIDENT_INCLUDE,
    });
    if (!resident) {
      throw new NotFoundException('Vínculo de morador não encontrado');
    }
    return resident;
  }

  async update(id: string, dto: UpdateResidentDto) {
    await this.findOne(id);
    return this.prisma.resident.update({
      where: { id },
      data: {
        isOwner: dto.isOwner,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: RESIDENT_INCLUDE,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.resident.delete({ where: { id } });
  }
}
