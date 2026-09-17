import { Controller, Get, Post, Body, Param, Sse } from '@nestjs/common';
import { TavernMarketService } from './tavern-market.service';
import { Observable } from 'rxjs';

@Controller('api/v1')
export class TavernMarketController {
  constructor(private readonly tavernMarketService: TavernMarketService) {}

  @Sse('events/stream')
  streamEvents(): Observable<{ data: any }> {
    return this.tavernMarketService.getEventsStream();
  }

  @Get('tavern/shouts')
  async getShouts() {
    return this.tavernMarketService.getRecentShouts();
  }

  @Post('tavern/shout')
  async postShout(@Body('playerId') playerId: string, @Body('message') message: string) {
    return this.tavernMarketService.postShout(playerId, message);
  }

  @Get('market/listings')
  async getMarketListings() {
    return this.tavernMarketService.getActiveMarketListings();
  }

  @Post('market/list')
  async createListing(
    @Body('playerId') playerId: string,
    @Body('invItemId') invItemId: string,
    @Body('goldPrice') goldPrice: number,
  ) {
    return this.tavernMarketService.createMarketListing(playerId, invItemId, goldPrice);
  }

  @Post('market/buy')
  async buyListing(
    @Body('buyerId') buyerId: string,
    @Body('listingId') listingId: string,
  ) {
    return this.tavernMarketService.buyMarketListing(buyerId, listingId);
  }
}
