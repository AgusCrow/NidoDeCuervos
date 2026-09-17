import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TavernShout, MarketListing } from '../../entities/tavern-market.entity';
import { Player } from '../../entities/player.entity';
import { Item } from '../../entities/item.entity';
import { InventoryItem } from '../../entities/inventory.entity';
import { Subject, Observable } from 'rxjs';

@Injectable()
export class TavernMarketService {
  private events$ = new Subject<{ data: any }>();

  constructor(
    @InjectRepository(TavernShout)
    private shoutRepo: Repository<TavernShout>,
    @InjectRepository(MarketListing)
    private marketRepo: Repository<MarketListing>,
    @InjectRepository(Player)
    private playerRepo: Repository<Player>,
    @InjectRepository(Item)
    private itemRepo: Repository<Item>,
    @InjectRepository(InventoryItem)
    private invRepo: Repository<InventoryItem>,
    private dataSource: DataSource,
  ) {}

  public getEventsStream(): Observable<{ data: any }> {
    return this.events$.asObservable();
  }

  public broadcastEvent(eventType: string, payload: any) {
    this.events$.next({
      data: {
        type: eventType,
        timestamp: new Date().toISOString(),
        payload,
      },
    });
  }

  // ==================================================
  // 1. MURO DE TABERNA
  // ==================================================
  async getRecentShouts(): Promise<TavernShout[]> {
    return this.shoutRepo.find({
      order: { created_at: 'DESC' },
      take: 50,
    });
  }

  async postShout(playerId: string, message: string): Promise<TavernShout> {
    if (!message || message.trim().length === 0) {
      throw new BadRequestException('El mensaje no puede estar vacío.');
    }
    const cleanMsg = message.trim().substring(0, 280);

    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Aventurero no encontrado.');

    const shout = this.shoutRepo.create({
      id: `shout_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      player_id: player.id,
      player_name: player.name,
      secret_class: player.secret_class,
      title: player.equipped_title || 'Aventurero',
      message: cleanMsg,
    });

    const saved = await this.shoutRepo.save(shout);

    this.broadcastEvent('TAVERN_SHOUT', {
      id: saved.id,
      playerName: saved.player_name,
      title: saved.title,
      message: saved.message,
      createdAt: saved.created_at,
    });

    return saved;
  }

  // ==================================================
  // 2. MERCADO P2P
  // ==================================================
  async getActiveMarketListings(): Promise<MarketListing[]> {
    return this.marketRepo.find({
      where: { status: 'ACTIVE' },
      order: { created_at: 'DESC' },
    });
  }

  async createMarketListing(playerId: string, invItemId: string, goldPrice: number): Promise<MarketListing> {
    if (goldPrice <= 0) {
      throw new BadRequestException('El precio en oro debe ser mayor a cero.');
    }

    const inv = await this.invRepo.findOne({
      where: { id: invItemId, player_id: playerId, is_equipped: false },
      relations: ['item'],
    });
    if (!inv) {
      throw new NotFoundException('Ítem no encontrado en tu mochila o está equipado.');
    }

    const seller = await this.playerRepo.findOne({ where: { id: playerId } });
    if (!seller) throw new NotFoundException('Vendedor no encontrado.');

    // Crear listado y remover del inventario del vendedor mientras esté publicado
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const listing = queryRunner.manager.create(MarketListing, {
        id: `mkt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        seller_id: seller.id,
        seller_name: seller.name,
        item_id: inv.item.id,
        item_name: inv.item.name,
        item_description: inv.item.description,
        item_icon: inv.item.icon || '📦',
        gold_price: goldPrice.toString(),
        status: 'ACTIVE',
      });

      await queryRunner.manager.delete(InventoryItem, { id: inv.id });
      const savedListing = await queryRunner.manager.save(MarketListing, listing);

      await queryRunner.commitTransaction();

      this.broadcastEvent('MARKET_NEW_LISTING', {
        id: savedListing.id,
        itemName: savedListing.item_name,
        goldPrice: Number(savedListing.gold_price),
        sellerName: savedListing.seller_name,
      });

      return savedListing;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async buyMarketListing(buyerId: string, listingId: string): Promise<any> {
    const listing = await this.marketRepo.findOne({ where: { id: listingId, status: 'ACTIVE' } });
    if (!listing) {
      throw new NotFoundException('El objeto ya no está disponible en el mercado.');
    }
    if (listing.seller_id === buyerId) {
      throw new BadRequestException('No puedes comprar tu propio objeto en venta.');
    }

    const buyer = await this.playerRepo.findOne({ where: { id: buyerId } });
    if (!buyer) throw new NotFoundException('Comprador no encontrado.');

    const price = BigInt(listing.gold_price);
    if (BigInt(buyer.gold) < price) {
      throw new BadRequestException('Oro insuficiente para comprar este objeto.');
    }

    const seller = await this.playerRepo.findOne({ where: { id: listing.seller_id } });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Transferir oro
      buyer.gold = (BigInt(buyer.gold) - price).toString();
      await queryRunner.manager.save(Player, buyer);

      if (seller) {
        seller.gold = (BigInt(seller.gold) + price).toString();
        await queryRunner.manager.save(Player, seller);
      }

      // Marcar listado como vendido
      listing.status = 'SOLD';
      listing.buyer_id = buyerId;
      await queryRunner.manager.save(MarketListing, listing);

      // Entregar ítem en inventario del comprador
      const newInv = queryRunner.manager.create(InventoryItem, {
        id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        player_id: buyerId,
        item_id: listing.item_id,
        is_equipped: false,
      });
      await queryRunner.manager.save(InventoryItem, newInv);

      await queryRunner.commitTransaction();

      this.broadcastEvent('MARKET_ITEM_SOLD', {
        itemName: listing.item_name,
        price: Number(listing.gold_price),
        sellerName: listing.seller_name,
        buyerName: buyer.name,
      });

      return {
        status: 'success',
        message: `¡Has adquirido con éxito "${listing.item_name}" por ${listing.gold_price} monedas de oro!`,
        newPlayerGold: Number(buyer.gold),
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
