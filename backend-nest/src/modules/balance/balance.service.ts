import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { DmBalanceAuditLog } from '../../entities/transmute-log.entity';

@Injectable()
export class BalanceService {
  private readonly logger = new Logger(BalanceService.name);
  private balanceCache: Map<string, any> = new Map();
  private readonly configDir = path.resolve(__dirname, '../../config/balance');
  private readonly defaultBackupDir = path.resolve(__dirname, '../../config/balance/defaults');

  constructor(
    @InjectRepository(DmBalanceAuditLog)
    private readonly auditRepo: Repository<DmBalanceAuditLog>,
  ) {
    this.loadAllConfigs();
  }

  public loadAllConfigs() {
    this.logger.log(`Cargando configuraciones de balance desde: ${this.configDir}`);
    const sections = ['classes', 'items', 'transmute', 'forge', 'combat', 'raid', 'economy'];
    
    for (const sec of sections) {
      const filePath = path.join(this.configDir, `${sec}_balance.json`);
      if (fs.existsSync(filePath)) {
        try {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          this.balanceCache.set(sec, content);
        } catch (err: any) {
          this.logger.error(`Error parseando ${filePath}: ${err.message}`);
        }
      } else {
        this.logger.warn(`Archivo de balance no encontrado: ${filePath}`);
      }
    }
    this.logger.log(`✅ ${this.balanceCache.size} secciones de balance cargadas en memoria.`);
  }

  public getAllConfigs(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of this.balanceCache.entries()) {
      result[key] = value;
    }
    return result;
  }

  public getSection(section: string): any {
    if (!this.balanceCache.has(section)) {
      throw new NotFoundException(`Sección de balance '${section}' no existe.`);
    }
    return this.balanceCache.get(section);
  }

  public async updateSection(
    section: string,
    newConfig: any,
    dmUser: { id: string; username: string }
  ): Promise<{ message: string; updatedSection: string; config: any }> {
    if (!this.balanceCache.has(section)) {
      throw new NotFoundException(`Sección de balance '${section}' no reconocida.`);
    }

    // Validaciones de dominio según sección
    this.validateSectionConfig(section, newConfig);

    const previousConfig = this.balanceCache.get(section);
    const filePath = path.join(this.configDir, `${section}_balance.json`);

    // 1. Escritura atómica a disco
    try {
      fs.writeFileSync(filePath, JSON.stringify(newConfig, null, 2), 'utf8');
    } catch (err: any) {
      this.logger.error(`Error guardando archivo ${filePath}: ${err.message}`);
      throw new BadRequestException(`No se pudo persistir la configuración de balance: ${err.message}`);
    }

    // 2. Hot-Reload en caché
    this.balanceCache.set(section, newConfig);
    this.logger.log(`⚡ Hot-Reload aplicado para sección: ${section} por DM ${dmUser.username}`);

    // 3. Auditoría en base de datos
    try {
      const auditLog = this.auditRepo.create({
        id: `bal_audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        dm_player_id: dmUser.id,
        dm_username: dmUser.username,
        section,
        previous_config: previousConfig,
        new_config: newConfig,
      });
      await this.auditRepo.save(auditLog);
    } catch (auditErr: any) {
      this.logger.warn(`No se pudo guardar auditoría de balance: ${auditErr.message}`);
    }

    return {
      message: `Configuración de balance '${section}' actualizada y aplicada en caliente exitosamente.`,
      updatedSection: section,
      config: newConfig,
    };
  }

  public async resetSection(
    section: string,
    dmUser: { id: string; username: string }
  ): Promise<{ message: string; resetSection: string; config: any }> {
    const backupPath = path.join(this.defaultBackupDir, `${section}_balance.json`);
    let defaultConfig = null;

    if (fs.existsSync(backupPath)) {
      defaultConfig = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    } else {
      // Re-generar defaults conocidos según sección
      defaultConfig = this.getFactoryDefaults(section);
    }

    const res = await this.updateSection(section, defaultConfig, dmUser);
    return {
      message: `Configuración de balance '${section}' restaurada a valores por defecto exitosamente.`,
      resetSection: section,
      config: res.config,
    };
  }

  public async getAuditLogs(limit = 50): Promise<DmBalanceAuditLog[]> {
    return await this.auditRepo.find({
      order: { applied_at: 'DESC' },
      take: limit,
    });
  }

  private validateSectionConfig(section: string, config: any) {
    if (!config || typeof config !== 'object') {
      throw new BadRequestException('El cuerpo de configuración debe ser un objeto JSON válido.');
    }

    if (section === 'transmute') {
      if (typeof config.required_items_count !== 'number' || config.required_items_count < 2 || config.required_items_count > 20) {
        throw new BadRequestException('required_items_count debe ser un entero entre 2 y 20.');
      }
      if (typeof config.double_jump_critical_chance_pct !== 'number' || config.double_jump_critical_chance_pct < 0 || config.double_jump_critical_chance_pct > 100) {
        throw new BadRequestException('double_jump_critical_chance_pct debe estar entre 0% y 100%.');
      }
    }

    if (section === 'economy') {
      if (config.currency?.max_gold_capacity && (config.currency.max_gold_capacity < 1000 || config.currency.max_gold_capacity > 2000000000)) {
        throw new BadRequestException('max_gold_capacity debe estar entre 1,000 y 2,000,000,000.');
      }
    }
  }

  private getFactoryDefaults(section: string): any {
    // Defaults de fábrica embebidos como salvaguarda
    if (section === 'transmute') {
      return {
        required_items_count: 9,
        double_jump_critical_chance_pct: 10.0,
        gold_cost_per_transmute: {
          COMMON: 25,
          UNCOMMON: 50,
          RARE: 120,
          EPIC: 300,
          LEGENDARY: 750,
          MYTHIC: 2000,
          ANCIENT: 5000,
          DIVINE: 15000,
          CELESTIAL: 40000,
          ETERNAL: 100000,
          PRIMORDIAL: 250000,
        },
        rarity_hierarchy: [
          'COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY',
          'MYTHIC', 'ANCIENT', 'DIVINE', 'CELESTIAL', 'ETERNAL', 'PRIMORDIAL'
        ]
      };
    }
    return this.balanceCache.get(section) || {};
  }
}
