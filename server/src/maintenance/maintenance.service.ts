import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MaintenanceStatus, Role } from '../common/enums';
import { AuthenticatedUser } from '../common/types';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';

const REQUEST_INCLUDE = {
  openedBy: { select: { id: true, name: true } },
  comments: {
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
};

@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateMaintenanceDto, openedById: string) {
    return this.prisma.maintenanceRequest.create({
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        unitId: dto.unitId,
        openedById,
      },
    });
  }

  findAll(user: AuthenticatedUser) {
    const where = user.role === Role.MORADOR ? { openedById: user.userId } : {};
    return this.prisma.maintenanceRequest.findMany({
      where,
      include: REQUEST_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id },
      include: REQUEST_INCLUDE,
    });
    if (!request) {
      throw new NotFoundException('Chamado não encontrado');
    }
    if (user.role === Role.MORADOR && request.openedById !== user.userId) {
      throw new ForbiddenException('Você não tem acesso a este chamado');
    }
    return request;
  }

  async updateStatus(id: string, status: MaintenanceStatus) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id },
    });
    if (!request) {
      throw new NotFoundException('Chamado não encontrado');
    }
    return this.prisma.maintenanceRequest.update({
      where: { id },
      data: {
        status,
        resolvedAt: status === MaintenanceStatus.RESOLVED ? new Date() : null,
      },
    });
  }

  async addComment(id: string, dto: CreateCommentDto, user: AuthenticatedUser) {
    await this.findOne(id, user);
    return this.prisma.maintenanceComment.create({
      data: { requestId: id, authorId: user.userId, message: dto.message },
      include: { author: { select: { id: true, name: true } } },
    });
  }
}
