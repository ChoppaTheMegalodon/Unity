import { Module } from '@nestjs/common';
import { PricesController } from './prices.controller';
import { PricesGateway } from './prices.gateway';

@Module({
  controllers: [PricesController],
  providers: [PricesGateway],
})
export class PricesModule {}
