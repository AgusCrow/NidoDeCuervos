export const DAILY_GOLD_LIMIT = 1_000_000_000; // 1 Billón de Oro Máximo por Día

/**
 * Servicio centralizado para otorgar oro a un jugador respetando el límite diario de 1B (1,000,000,000).
 */
export function awardPlayerGold(
  player: any, 
  amountToAward: number
): { awarded: number; capped: boolean; totalGold: number; dailyEarned: number } {
  const todayStr = new Date().toISOString().slice(0, 10);
  const qty = Math.max(0, Math.floor(amountToAward));

  if (player.gold_earned_date !== todayStr) {
    player.gold_earned_date = todayStr;
    player.daily_gold_earned = 0;
  }

  const currentDaily = player.daily_gold_earned || 0;
  const remainingCap = Math.max(0, DAILY_GOLD_LIMIT - currentDaily);

  const actualAwarded = Math.min(qty, remainingCap);
  const capped = qty > remainingCap;

  player.daily_gold_earned = currentDaily + actualAwarded;
  player.gold = (player.gold || 0) + actualAwarded;

  return {
    awarded: actualAwarded,
    capped,
    totalGold: player.gold,
    dailyEarned: player.daily_gold_earned
  };
}
