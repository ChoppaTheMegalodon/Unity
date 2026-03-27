import { Controller, Get, Param, Query } from '@nestjs/common';
import { FeedsService } from './feeds.service';

@Controller('feeds')
export class FeedsController {
  constructor(private feedsService: FeedsService) {}

  @Get()
  async listFeeds(@Query('class') assetClass?: string) {
    return this.feedsService.listFeeds(assetClass);
  }

  @Get('search')
  async searchFeeds(@Query('q') q: string) {
    if (!q || q.length < 1) return [];
    return this.feedsService.searchFeeds(q);
  }

  @Get(':feedId')
  async getFeed(@Param('feedId') feedId: string) {
    return this.feedsService.getFeed(feedId);
  }
}
