import { Controller, Get, Param, Query } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Controller('prices')
export class PricesController {
  constructor(private redis: RedisService) {}

  @Get()
  async batchPrices(@Query('ids') ids: string) {
    if (!ids) return {};
    const feedIds = ids.split(',').map((id) => id.trim());
    return this.redis.getPrices(feedIds);
  }

  @Get(':feedId')
  async getPrice(@Param('feedId') feedId: string) {
    return this.redis.getPrice(feedId);
  }
}
