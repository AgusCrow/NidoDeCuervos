import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JourneyProgress } from '../../entities/journey-progress.entity';
import { RaidBoss, RaidContribution } from '../../entities/raid-boss.entity';
import { Player } from '../../entities/player.entity';

@Injectable()
export class RunsService {
  constructor(
    @InjectRepository(JourneyProgress)
    private journeyRepo: Repository<JourneyProgress>,
    @InjectRepository(RaidBoss)
    private raidBossRepo: Repository<RaidBoss>,
    @InjectRepository(RaidContribution)
    private raidContribRepo: Repository<RaidContribution>,
    @InjectRepository(Player)
    private playerRepo: Repository<Player>,
  ) {}

  // ==========================================
  // 1. SENDA INFINITA (Idle Journey)
  // ==========================================
  async getJourneyState(playerId: string): Promise<any> {
    let progress = await this.journeyRepo.findOne({ where: { player_id: playerId } });
    if (!progress) {
      progress = this.journeyRepo.create({
        player_id: playerId,
        biome_id: 'bosque_sombras',
        wave_depth: 1,
        current_monster_index: 1,
        monster_current_hp: 120,
        monster_max_hp: 120,
        monster_name: 'Lobo de Ceniza',
        monster_icon: '🐺',
        total_monsters_slain: 0,
        accumulated_gold: '0',
        accumulated_xp: '0',
        accumulated_items: [],
      });
      await this.journeyRepo.save(progress);
    }

    return {
      playerId: progress.player_id,
      biome: {
        id: progress.biome_id,
        name: this.getBiomeName(progress.biome_id),
        icon: this.getBiomeIcon(progress.biome_id),
      },
      wave: progress.wave_depth,
      monster: {
        name: progress.monster_name,
        icon: progress.monster_icon,
        currentHp: progress.monster_current_hp,
        maxHp: progress.monster_max_hp,
      },
      accumulated: {
        gold: Number(progress.accumulated_gold),
        xp: Number(progress.accumulated_xp),
        monstersSlain: progress.total_monsters_slain,
        itemsCount: (progress.accumulated_items || []).length,
      },
    };
  }

  async tickJourney(playerId: string): Promise<any> {
    const progress = await this.journeyRepo.findOne({ where: { player_id: playerId } });
    if (!progress) throw new NotFoundException('Progreso no encontrado');

    const damage = Math.floor(Math.random() * 25) + 30; // 30-55 daño
    let monsterDefeated = false;
    let newHp = progress.monster_current_hp - damage;

    if (newHp <= 0) {
      monsterDefeated = true;
      progress.total_monsters_slain += 1;
      const goldEarned = Math.floor(Math.random() * 15) + 10;
      const xpEarned = Math.floor(Math.random() * 20) + 15;
      progress.accumulated_gold = (Number(progress.accumulated_gold) + goldEarned).toString();
      progress.accumulated_xp = (Number(progress.accumulated_xp) + xpEarned).toString();

      // Siguiente monstruo
      const nextDepth = progress.wave_depth + 1;
      progress.wave_depth = nextDepth;
      const nextMaxHp = 100 + nextDepth * 25;
      progress.monster_max_hp = nextMaxHp;
      progress.monster_current_hp = nextMaxHp;
      const nextMon = this.getRandomMonster(progress.biome_id);
      progress.monster_name = nextMon.name;
      progress.monster_icon = nextMon.icon;
    } else {
      progress.monster_current_hp = newHp;
    }

    await this.journeyRepo.save(progress);

    return {
      damageDealt: damage,
      monsterDefeated,
      monsterHp: progress.monster_current_hp,
      monsterMaxHp: progress.monster_max_hp,
      accumulatedGold: Number(progress.accumulated_gold),
      accumulatedXp: Number(progress.accumulated_xp),
      wave: progress.wave_depth,
      nextMonster: monsterDefeated ? { name: progress.monster_name, icon: progress.monster_icon } : null,
    };
  }

  async selectBiome(playerId: string, biomeId: string): Promise<any> {
    const progress = await this.journeyRepo.findOne({ where: { player_id: playerId } });
    if (!progress) throw new NotFoundException('Progreso no encontrado');
    progress.biome_id = biomeId;
    const mon = this.getRandomMonster(biomeId);
    progress.monster_name = mon.name;
    progress.monster_icon = mon.icon;
    progress.monster_current_hp = 150;
    progress.monster_max_hp = 150;
    await this.journeyRepo.save(progress);
    return { status: 'success', message: `Has adentrado en ${this.getBiomeName(biomeId)}` };
  }

  async claimAfk(playerId: string): Promise<any> {
    const progress = await this.journeyRepo.findOne({ where: { player_id: playerId } });
    if (!progress) throw new NotFoundException('Progreso no encontrado');

    const goldToClaim = Number(progress.accumulated_gold);
    const xpToClaim = Number(progress.accumulated_xp);

    if (goldToClaim === 0 && xpToClaim === 0) {
      throw new BadRequestException('No hay botín acumulado para reclamar.');
    }

    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Jugador no encontrado');

    player.gold = (Number(player.gold) + goldToClaim).toString();
    player.xp = (Number(player.xp) + xpToClaim).toString();

    progress.accumulated_gold = '0';
    progress.accumulated_xp = '0';

    await this.playerRepo.save(player);
    await this.journeyRepo.save(progress);

    return {
      status: 'success',
      claimedGold: goldToClaim,
      claimedXp: xpToClaim,
      newPlayerGold: Number(player.gold),
      newPlayerXp: Number(player.xp),
      message: `¡Has regresado triunfante a la taberna con ${goldToClaim} monedas de oro y ${xpToClaim} XP!`,
    };
  }

  // ==========================================
  // 2. CATACUMBAS DEL OLVIDO (Auto-Battler)
  // ==========================================
  async runCatacombsWave(playerId: string, floor: number): Promise<any> {
    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Jugador no encontrado');

    const rolls = [
      Math.floor(Math.random() * 20) + 1,
      Math.floor(Math.random() * 20) + 1,
      Math.floor(Math.random() * 20) + 1,
    ];
    const totalScore = rolls.reduce((a, b) => a + b, 0);
    const victory = totalScore >= 28;

    let goldReward = 0;
    let xpReward = 0;
    let fragmentReward = 0;

    if (victory) {
      goldReward = floor * 25 + Math.floor(Math.random() * 20);
      xpReward = floor * 40 + Math.floor(Math.random() * 30);
      fragmentReward = Math.floor(Math.random() * 3) + 1;
      player.gold = (Number(player.gold) + goldReward).toString();
      player.xp = (Number(player.xp) + xpReward).toString();
      await this.playerRepo.save(player);
    }

    return {
      floor,
      victory,
      diceRolls: rolls,
      totalScore,
      rewards: victory ? { gold: goldReward, xp: xpReward, fragments: fragmentReward } : null,
      battleLog: [
        `Ronda 1: Tirada de ataque [${rolls[0]}]. Golpeas a los no-muertos del piso ${floor}.`,
        `Ronda 2: Maniobra evasiva [${rolls[1]}]. Esquivas los zarpazos en la oscuridad.`,
        `Ronda 3: Golpe de gracia [${rolls[2]}]. ${victory ? '¡Sala purificada con éxito!' : '¡Superado en número! Te retiras a curarte.'}`,
      ],
    };
  }

  // ==========================================
  // 3. EXPEDICIONES POR TIEMPO
  // ==========================================
  getExpeditionsList(): any[] {
    return [
      {
        id: 'exp_01',
        title: 'Patrulla de los Caminos de la Taberna',
        difficulty: 'EASY',
        durationMinutes: 30,
        rewardGold: 120,
        rewardXp: 80,
        icon: '🌲',
        status: 'READY',
      },
      {
        id: 'exp_02',
        title: 'Exploración de las Ruinas de Cinderfall',
        difficulty: 'MEDIUM',
        durationMinutes: 120,
        rewardGold: 350,
        rewardXp: 260,
        icon: '🏛️',
        status: 'READY',
      },
      {
        id: 'exp_03',
        title: 'Gran Cruzada a la Cima de los Titanes',
        difficulty: 'HARD',
        durationMinutes: 480,
        rewardGold: 1200,
        rewardXp: 950,
        icon: '⛰️',
        status: 'READY',
      },
    ];
  }

  async claimExpeditionReward(playerId: string, expId: string): Promise<any> {
    const expeditions = this.getExpeditionsList();
    const exp = expeditions.find(e => e.id === expId) || expeditions[0];
    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Jugador no encontrado');

    player.gold = (Number(player.gold) + exp.rewardGold).toString();
    player.xp = (Number(player.xp) + exp.rewardXp).toString();
    await this.playerRepo.save(player);

    return {
      status: 'success',
      gold: exp.rewardGold,
      xp: exp.rewardXp,
      message: `¡Expedición "${exp.title}" completada! Recibes ${exp.rewardGold} oro y ${exp.rewardXp} XP.`,
    };
  }

  // ==========================================
  // 4. INCURSIÓN A COLOSOS (Raid Boss)
  // ==========================================
  async getRaidBossState(): Promise<any> {
    let boss = await this.raidBossRepo.findOne({ where: { is_active: true } });
    if (!boss) {
      boss = this.raidBossRepo.create({
        id: 'volcanic_colossus',
        name: 'Ignis el Coloso Ígneo',
        title: 'Azote de las Profundidades',
        current_hp: '412000',
        max_hp: '500000',
        tier: 'MYTHIC',
        phase: 1,
        element: 'FIRE',
        is_active: true,
        milestones_achieved: [75],
      });
      await this.raidBossRepo.save(boss);
    }

    const currentHp = Number(boss.current_hp);
    const maxHp = Number(boss.max_hp);
    const hpPct = Math.max(0, Math.round((currentHp / maxHp) * 100));

    const topContributors = await this.raidContribRepo.find({
      where: { raid_id: boss.id },
      order: { damage_dealt: 'DESC' },
      take: 5,
    });

    return {
      boss: {
        id: boss.id,
        name: boss.name,
        title: boss.title,
        element: boss.element,
        currentHp,
        maxHp,
        hpPct,
        tier: boss.tier,
      },
      milestones: [
        { pct: 75, achieved: true, reward: 'Cofre Raro (500 XP, 300 Oro)' },
        { pct: 50, achieved: hpPct <= 50, reward: 'Cofre Épico (1,000 XP, 600 Oro)' },
        { pct: 25, achieved: hpPct <= 25, reward: 'Cofre Legendario (2,000 XP, 1,200 Oro)' },
        { pct: 0, achieved: hpPct === 0, reward: 'Botín Primordial Divino' },
      ],
      topContributors: topContributors.map((c, i) => ({
        rank: i + 1,
        name: c.player_name,
        damage: Number(c.damage_dealt),
      })),
    };
  }

  async attackRaidBoss(playerId: string, playerName: string): Promise<any> {
    let boss = await this.raidBossRepo.findOne({ where: { is_active: true } });
    if (!boss) throw new NotFoundException('No hay Coloso activo en este momento.');

    const d20 = Math.floor(Math.random() * 20) + 1;
    const isCrit = d20 >= 18;
    const damage = isCrit ? Math.floor(Math.random() * 3000) + 5000 : Math.floor(Math.random() * 1500) + 1200;

    let currentHp = Number(boss.current_hp);
    currentHp = Math.max(0, currentHp - damage);
    boss.current_hp = currentHp.toString();
    await this.raidBossRepo.save(boss);

    let contrib = await this.raidContribRepo.findOne({
      where: { raid_id: boss.id, player_id: playerId },
    });
    if (!contrib) {
      contrib = this.raidContribRepo.create({
        id: `${boss.id}_${playerId}`,
        raid_id: boss.id,
        player_id: playerId,
        player_name: playerName,
        damage_dealt: damage.toString(),
      });
    } else {
      contrib.damage_dealt = (Number(contrib.damage_dealt) + damage).toString();
      contrib.last_attack_at = new Date();
    }
    await this.raidContribRepo.save(contrib);

    const xpAwarded = Math.floor(damage / 50) + 15;
    const goldAwarded = Math.floor(damage / 100) + 10;
    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    if (player) {
      player.xp = (Number(player.xp) + xpAwarded).toString();
      player.gold = (Number(player.gold) + goldAwarded).toString();
      await this.playerRepo.save(player);
    }

    return {
      status: 'success',
      roll: d20,
      isCrit,
      damageDealt: damage,
      bossHpRemaining: currentHp,
      bossMaxHp: Number(boss.max_hp),
      rewards: { xp: xpAwarded, gold: goldAwarded },
      message: isCrit
        ? `¡GOLPE CRÍTICO DIVINO [D20: ${d20}]! Asestas un impacto destructor de ${damage} puntos a ${boss.name}.`
        : `¡Impacto certero [D20: ${d20}]! Infliges ${damage} de daño a ${boss.name}.`,
    };
  }

  // Auxiliares
  private getBiomeName(id: string): string {
    const biomes: Record<string, string> = {
      bosque_sombras: 'Bosque de las Sombras',
      cripta_carmesi: 'Cripta Carmesí',
      volcan_olvidado: 'Volcán Olvidado',
      picos_helados: 'Picos Helados de Ymir',
    };
    return biomes[id] || 'Tierras Desconocidas';
  }

  private getBiomeIcon(id: string): string {
    const icons: Record<string, string> = {
      bosque_sombras: '🌲',
      cripta_carmesi: '💀',
      volcan_olvidado: '🌋',
      picos_helados: '❄️',
    };
    return icons[id] || '🗺️';
  }

  private getRandomMonster(biomeId: string): { name: string; icon: string } {
    const monsters: Record<string, Array<{ name: string; icon: string }>> = {
      bosque_sombras: [
        { name: 'Lobo de Ceniza', icon: '🐺' },
        { name: 'Dríade Corrupta', icon: '🌿' },
        { name: 'Oso Rabioso', icon: '🐻' },
        { name: 'Espectro Arbóreo', icon: '👻' },
      ],
      cripta_carmesi: [
        { name: 'Guardián Esquelético', icon: '💀' },
        { name: 'Necrófago Hambriento', icon: '🧟' },
        { name: 'Señor Vampírico', icon: '🦇' },
      ],
      volcan_olvidado: [
        { name: 'Elemental de Magma', icon: '🔥' },
        { name: 'Salamandra Ígnea', icon: '🦎' },
        { name: 'Gólem de Lava', icon: '🗿' },
      ],
      picos_helados: [
        { name: 'Lobo Polar Huargo', icon: '🐺' },
        { name: 'Yeti de las Nieves', icon: '❄️' },
      ],
    };
    const list = monsters[biomeId] || monsters['bosque_sombras'];
    return list[Math.floor(Math.random() * list.length)];
  }
}
