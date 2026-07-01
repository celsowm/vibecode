import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { CommonAreasService } from './common-areas.service';
import { CreateCommonAreaDto } from './dto/create-common-area.dto';
import { UpdateCommonAreaDto } from './dto/update-common-area.dto';

@Controller('common-areas')
export class CommonAreasController {
  constructor(private commonAreasService: CommonAreasService) {}

  @Get()
  findAll() {
    return this.commonAreasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commonAreasService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SINDICO)
  create(@Body() dto: CreateCommonAreaDto) {
    return this.commonAreasService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SINDICO)
  update(@Param('id') id: string, @Body() dto: UpdateCommonAreaDto) {
    return this.commonAreasService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SINDICO)
  remove(@Param('id') id: string) {
    return this.commonAreasService.remove(id);
  }
}
