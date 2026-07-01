import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommonAreaDto } from './dto/create-common-area.dto';
import { UpdateCommonAreaDto } from './dto/update-common-area.dto';

@Injectable()
export class CommonAreasService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateCommonAreaDto) {
    return this.prisma.commonArea.create({ data: dto });
  }

  findAll() {
    return this.prisma.commonArea.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const area = await this.prisma.commonArea.findUnique({ where: { id } });
    if (!area) {
      throw new NotFoundException('Área comum não encontrada');
    }
    return area;
  }

  async update(id: string, dto: UpdateCommonAreaDto) {
    await this.findOne(id);
    return this.prisma.commonArea.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.commonArea.delete({ where: { id } });
  }
}
