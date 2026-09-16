const BASE_URL = '/api/v1';

export function getStoredToken(): string | null {
  return localStorage.getItem('gremio_token');
}

export function setStoredToken(token: string) {
  localStorage.setItem('gremio_token', token);
}

export function clearStoredToken() {
  localStorage.removeItem('gremio_token');
}

async function request(endpoint: string, options: RequestInit = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (response.status === 401 && !endpoint.includes('/auth/')) {
    clearStoredToken();
  }

  if (!response.ok) {
    throw new Error(data.error || 'Error en la petición al servidor');
  }

  return data;
}

export const api = {
  // Auth endpoints
  login: (credentials: { username?: string; password?: string; nfcUid?: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (data: { username: string; password: string; name: string; secretClass: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  nfcLogin: (nfcUid: string) =>
    request('/auth/nfc-login', { method: 'POST', body: JSON.stringify({ nfcUid }) }),

  // Player endpoints
  getMe: () => request('/player/me'),
  claimDailyMedal: () => request('/player/daily-claim', { method: 'POST' }),
  challengePvPDuel: (opponentId: string, wager: number = 10) =>
    request('/player/pvp/challenge', { method: 'POST', body: JSON.stringify({ opponentId, wager }) }),
  getPendingChallenges: () => request('/player/pvp/challenges'),
  acceptPvPDuel: (challengeId: string) => request('/player/pvp/accept', { method: 'POST', body: JSON.stringify({ challengeId }) }),
  declinePvPDuel: (challengeId: string) => request('/player/pvp/decline', { method: 'POST', body: JSON.stringify({ challengeId }) }),
  getShopItems: (slot?: string) => request(`/player/shop/items${slot && slot !== 'ALL' ? `?slot=${slot}` : ''}`),
  buyItem: (itemId: string) => request('/player/shop/buy', { method: 'POST', body: JSON.stringify({ itemId }) }),
  sellItem: (inventoryId: string) => request(`/player/shop/sell/${inventoryId}`, { method: 'POST' }),
  equipItem: (inventoryId: string) => request('/player/inventory/equip', { method: 'POST', body: JSON.stringify({ inventoryId }) }),
  useConsumable: (inventoryId: string) => request(`/player/inventory/use-consumable/${inventoryId}`, { method: 'POST' }),
  getTitles: () => request('/player/titles'),
  equipTitle: (titleId: string) => request('/player/titles/equip', { method: 'POST', body: JSON.stringify({ titleId }) }),
  getQuests: () => request('/player/quests'),

  // DM endpoints
  getParty: () => request('/dm/party'),
  createPlayer: (data: { name: string; username?: string; nfcUid: string; secretClass: string; role?: string }) =>
    request('/dm/players', { method: 'POST', body: JSON.stringify(data) }),
  updatePlayer: (id: string, data: any) =>
    request(`/dm/players/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deletePlayer: (id: string) =>
    request(`/dm/players/${id}`, { method: 'DELETE' }),
  resetCooldown: (id: string) =>
    request(`/dm/players/${id}/reset-cooldown`, { method: 'POST' }),
  grantItem: (id: string, itemId: string, quantity: number = 1) =>
    request(`/dm/players/${id}/grant-item`, { method: 'POST', body: JSON.stringify({ itemId, quantity }) }),
  grantPartyRewards: (data: { xp: number; gold: number; reason?: string; playerIds?: string[] }) =>
    request('/dm/party/grant-rewards', { method: 'POST', body: JSON.stringify(data) }),
  createShopItem: (data: { name: string; description?: string; price: number; type: string; effectValue?: number; icon?: string }) =>
    request('/dm/items', { method: 'POST', body: JSON.stringify(data) }),
  deleteShopItem: (id: string) =>
    request(`/dm/items/${id}`, { method: 'DELETE' }),
  triggerGlobalBuff: (data: { active: boolean; name?: string; xpMultiplier?: number; goldMultiplier?: number; durationMinutes?: number }) =>
    request('/dm/events/global-buff', { method: 'POST', body: JSON.stringify(data) }),
  getTelemetry: () => request('/dm/telemetry'),

  // Scan simulation
  triggerScan: (nfcUid: string, bypassCooldown: boolean = false) =>
    request('/scan/nfc', { method: 'POST', body: JSON.stringify({ nfcUid, bypassCooldown }) }),

  // Version and System Updates
  getVersionInfo: () => request('/version'),
  checkUpdate: (clientVersion: string) => request(`/version/check?clientVersion=${encodeURIComponent(clientVersion)}`),

  // v1.3.0 Leaderboard & Fast Equip
  getLeaderboard: () => request('/player/leaderboard'),
  buyAndEquipItem: (itemId: string) => request('/player/shop/buy-and-equip', { method: 'POST', body: JSON.stringify({ itemId }) }),

  // v3.4.0 Lore & NPC Talk
  getNPCTalk: (npcId: string) => request(`/player/lore/npc-talk/${npcId}`),
  getTavernRumors: () => request('/player/lore/rumors'),

  // Senda Infinita (Aventura Procedural Continua)
  getJourneyState: () => request('/player/journey/state'),
  journeyTick: () => request('/player/journey/tick', { method: 'POST' }),
  selectJourneyBiome: (biomeId: string) => request('/player/journey/select-biome', { method: 'POST', body: JSON.stringify({ biomeId }) }),
  claimJourneyAfk: () => request('/player/journey/claim-afk', { method: 'POST' }),

  // Alias compatibles para componentes existentes
  getTaskbarState: () => request('/player/journey/state'),
  taskbarTick: () => request('/player/journey/tick', { method: 'POST' }),
  selectTaskbarBiome: (biomeId: string) => request('/player/journey/select-biome', { method: 'POST', body: JSON.stringify({ biomeId }) }),
  claimTaskbarAfk: () => request('/player/journey/claim-afk', { method: 'POST' }),
  // Guild Raids (Jefes de Gremio Asíncronos)
  getGuildRaidState: () => request('/player/raid/guild-state'),
  startGuildRaidAssault: () => request('/player/raid/start-assault', { method: 'POST' }),
  finishGuildRaidAssault: (data: { sessionDamage: number; attacksCount?: number; critsCount?: number }) =>
    request('/player/raid/finish-assault', { method: 'POST', body: JSON.stringify(data) }),
  claimGuildRaidMilestone: (milestoneId: string) =>
    request('/player/raid/claim-milestone', { method: 'POST', body: JSON.stringify({ milestoneId }) }),
  buyGuildRaidShopItem: (itemId: string) =>
    request('/player/raid/shop-buy', { method: 'POST', body: JSON.stringify({ itemId }) }),

  // Solo Raids & Clan Wars (Tug of War)
  getTugOfWarState: () => request('/player/clans/war/tug-of-war'),
  sendTugOfWarAction: (actionType: string) =>
    request('/player/clans/war/action', { method: 'POST', body: JSON.stringify({ actionType }) }),
  resolveSoloRaidRoom: (data: { dungeon_id: string; room_index: number; tactic: string }) =>
    request('/player/clans/solo-raid/room-action', { method: 'POST', body: JSON.stringify(data) }),

  // Generic REST helpers
  get: async (endpoint: string) => {
    const data = await request(endpoint);
    return { data };
  },
  post: async (endpoint: string, body?: any) => {
    const data = await request(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
    return { data };
  }
};

export default api;
