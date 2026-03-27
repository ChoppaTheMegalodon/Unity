import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PortfoliosService } from './portfolios.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('watchlists')
@UseGuards(JwtAuthGuard)
export class WatchlistsController {
  constructor(private portfoliosService: PortfoliosService) {}

  @Get()
  async list(@Request() req: any) {
    return this.portfoliosService.listWatchlists(req.user.userId);
  }

  @Post()
  async create(
    @Request() req: any,
    @Body() body: { name: string; feedIds: string[] },
  ) {
    return this.portfoliosService.createWatchlist(
      req.user.userId,
      body.name,
      body.feedIds,
      req.user.tier,
    );
  }

  @Put(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { name?: string; feedIds?: string[] },
  ) {
    return this.portfoliosService.updateWatchlist(req.user.userId, id, body);
  }

  @Delete(':id')
  async delete(@Request() req: any, @Param('id') id: string) {
    return this.portfoliosService.deleteWatchlist(req.user.userId, id);
  }
}
