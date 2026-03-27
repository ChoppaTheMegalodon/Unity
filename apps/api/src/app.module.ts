import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { PriceEngineModule } from './price-engine/price-engine.module';
import { FeedsModule } from './feeds/feeds.module';
import { PortfoliosModule } from './portfolios/portfolios.module';
import { PricesModule } from './prices/prices.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    RedisModule,
    AuthModule,
    PriceEngineModule,
    FeedsModule,
    PortfoliosModule,
    PricesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
