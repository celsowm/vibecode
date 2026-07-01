import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { CommonAreasController } from './common-areas.controller';
import { CommonAreasService } from './common-areas.service';

@Module({
  controllers: [CommonAreasController, BookingsController],
  providers: [CommonAreasService, BookingsService],
})
export class BookingsModule {}
