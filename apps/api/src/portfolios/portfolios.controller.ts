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

@Controller('portfolios')
@UseGuards(JwtAuthGuard)
export class PortfoliosController {
  constructor(private portfoliosService: PortfoliosService) {}

  @Get()
  async list(@Request() req: any) {
    return this.portfoliosService.listPortfolios(req.user.userId);
  }

  @Post()
  async create(@Request() req: any, @Body() body: { name: string }) {
    return this.portfoliosService.createPortfolio(
      req.user.userId,
      body.name,
      req.user.tier,
    );
  }

  @Get(':id')
  async get(@Request() req: any, @Param('id') id: string) {
    return this.portfoliosService.getPortfolio(req.user.userId, id);
  }

  @Put(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { name?: string; currency?: string },
  ) {
    return this.portfoliosService.updatePortfolio(req.user.userId, id, body);
  }

  @Delete(':id')
  async delete(@Request() req: any, @Param('id') id: string) {
    return this.portfoliosService.deletePortfolio(req.user.userId, id);
  }

  // ── Positions ──

  @Get(':id/positions')
  async listPositions(@Request() req: any, @Param('id') id: string) {
    return this.portfoliosService.listPositions(req.user.userId, id);
  }

  @Post(':id/positions')
  async addPosition(
    @Request() req: any,
    @Param('id') id: string,
    @Body()
    body: {
      feedId: string;
      symbol: string;
      assetClass: string;
      quantity: string;
      avgCostBasis?: string;
      notes?: string;
    },
  ) {
    return this.portfoliosService.addPosition(
      req.user.userId,
      id,
      body,
      req.user.tier,
    );
  }

  @Put(':id/positions/:posId')
  async updatePosition(
    @Request() req: any,
    @Param('id') id: string,
    @Param('posId') posId: string,
    @Body() body: { quantity?: string; avgCostBasis?: string; notes?: string },
  ) {
    return this.portfoliosService.updatePosition(req.user.userId, id, posId, body);
  }

  @Delete(':id/positions/:posId')
  async deletePosition(
    @Request() req: any,
    @Param('id') id: string,
    @Param('posId') posId: string,
  ) {
    return this.portfoliosService.deletePosition(req.user.userId, id, posId);
  }
}
