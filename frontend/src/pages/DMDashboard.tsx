import React, { useState, useEffect } from 'react';
import { Player, Item } from '../types';
import { api } from '../services/api';

export const DMDashboard: React.FC = () => {
  const [party, setParty] = useState<Player[]>([]);
  const [shopItems, setShopItems] = useState<Item[]>([]);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active DM Tab
  const [activeTab, setActiveTab] = useState<'roster' | 'shop' | 'events' | 'telemetry'>('roster');

  // Modal / Form States
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showCreatePlayerModal, setShowCreatePlayerModal] = useState<boolean>(false);
  const [showGrantItemModal, setShowGrantItemModal] = useState<Player | null>(null);

  // Forms
  const [playerForm, setPlayerForm] = useState({
    name: '',
    username: '',
    nfcUid: '',
    secretClass: 'ROGUE',
    level: 1,
    xp: 0,
    gold: 0
  });

  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: 50,
    type: 'XP_BOOST',
    effectValue: 20,
    icon: 'auto_awesome'
  });

  const [rewardForm, setRewardForm] = useState({
    xp: 100,
    gold: 50,
    reason: 'Completar misión del Gremio'
  });

  const [buffForm, setBuffForm] = useState({
    active: true,
    name: 'Noche de Celebración en la Taberna',
    xpMultiplier: 1.5,
    goldMultiplier: 1.5,
    durationMinutes: 60
  });

  const [grantForm, setGrantForm] = useState({
    itemId: '',
    quantity: 1
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [partyRes, itemsRes, telemRes] = await Promise.all([
        api.getParty(),
        api.getShopItems(),
        api.getTelemetry()
      ]);
      setParty(partyRes.party);
      setShopItems(itemsRes.items);
      setTelemetry(telemRes);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar panel de DM');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Player Handlers
  const handleOpenEdit = (p: Player) => {
    setEditingPlayer(p);
    setPlayerForm({
      name: p.name,
      username: p.username || '',
      nfcUid: p.nfc_uid || p.nfcUid || '',
      secretClass: p.secret_class || p.secretClass || 'ROGUE',
      level: p.level,
      xp: p.xp,
      gold: p.gold
    });
  };

  const handleSavePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer) return;
    try {
      await api.updatePlayer(editingPlayer.id, playerForm);
      setEditingPlayer(null);
      await loadData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createPlayer({
        name: playerForm.name,
        username: playerForm.username,
        nfcUid: playerForm.nfcUid,
        secretClass: playerForm.secretClass
      });
      setShowCreatePlayerModal(false);
      setPlayerForm({ name: '', username: '', nfcUid: '', secretClass: 'ROGUE', level: 1, xp: 0, gold: 0 });
      await loadData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeletePlayer = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar al aventurero '${name}' del Gremio?`)) return;
    try {
      await api.deletePlayer(id);
      await loadData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleQuickXP = async (p: Player, amount: number) => {
    try {
      await api.updatePlayer(p.id, { xp: p.xp + amount, gold: p.gold });
      await loadData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleQuickGold = async (p: Player, amount: number) => {
    try {
      await api.updatePlayer(p.id, { xp: p.xp, gold: p.gold + amount });
      await loadData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleResetCooldown = async (id: string) => {
    try {
      await api.resetCooldown(id);
      await loadData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Item Handlers
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createShopItem(itemForm);
      setItemForm({ name: '', description: '', price: 50, type: 'XP_BOOST', effectValue: 20, icon: 'auto_awesome' });
      await loadData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!confirm(`¿Retirar '${name}' de la Tienda?`)) return;
    try {
      await api.deleteShopItem(id);
      await loadData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleGrantItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showGrantItemModal || !grantForm.itemId) return;
    try {
      await api.grantItem(showGrantItemModal.id, grantForm.itemId, grantForm.quantity);
      setShowGrantItemModal(null);
      alert(`¡Objeto entregado exitosamente a ${showGrantItemModal.name}!`);
      await loadData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Events & Party Rewards Handlers
  const handleGrantPartyRewards = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.grantPartyRewards(rewardForm);
      alert('¡Recompensas masivas otorgadas a la party!');
      await loadData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleTriggerBuff = async (active: boolean) => {
    try {
      await api.triggerGlobalBuff({ ...buffForm, active });
      await loadData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading && !party.length) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* DM Header */}
      <div className="modern-glass-card rounded-2xl p-6 shadow-2xl relative overflow-hidden border border-primary/40">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="material-symbols-outlined text-3xl text-primary animate-pulse">admin_panel_settings</span>
              <h1 className="font-cinzel text-2xl md:text-3xl font-extrabold text-primary">PANEL DE CONTROL DM (GOD MODE)</h1>
            </div>
            <p className="text-gray-300 text-xs md:text-sm mt-1">
              Control absoluto de la aventura: Modifica niveles, oro, clases secretas, crea artefactos mágicos y gestiona eventos del Gremio.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleResetCooldown('ALL')}
              className="bg-primary/20 hover:bg-primary/40 text-primary border border-primary/50 px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all"
            >
              <span className="material-symbols-outlined text-lg">restart_alt</span>
              <span>Reset Cooldowns Party</span>
            </button>
            <button
              onClick={() => {
                setPlayerForm({ name: '', username: '', nfcUid: '', secretClass: 'ROGUE', level: 1, xp: 0, gold: 0 });
                setShowCreatePlayerModal(true);
              }}
              className="btn-mobile-primary !w-auto !min-h-0 text-xs px-4 py-2"
            >
              <span className="material-symbols-outlined text-lg">person_add</span>
              <span>Nuevo Aventurero</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 mt-6 border-b border-surface-border pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 rounded-xl font-cinzel text-xs font-bold flex items-center space-x-2 transition-all ${
              activeTab === 'roster'
                ? 'bg-primary text-black shadow-[0_0_12px_var(--accent-glow)]'
                : 'text-gray-400 hover:text-white hover:bg-surface-card'
            }`}
          >
            <span className="material-symbols-outlined text-lg">group</span>
            <span>Aventureros ({party.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('shop')}
            className={`px-4 py-2 rounded-xl font-cinzel text-xs font-bold flex items-center space-x-2 transition-all ${
              activeTab === 'shop'
                ? 'bg-primary text-black shadow-[0_0_12px_var(--accent-glow)]'
                : 'text-gray-400 hover:text-white hover:bg-surface-card'
            }`}
          >
            <span className="material-symbols-outlined text-lg">storefront</span>
            <span>Tienda y Artefactos</span>
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-xl font-cinzel text-xs font-bold flex items-center space-x-2 transition-all ${
              activeTab === 'events'
                ? 'bg-primary text-black shadow-[0_0_12px_var(--accent-glow)]'
                : 'text-gray-400 hover:text-white hover:bg-surface-card'
            }`}
          >
            <span className="material-symbols-outlined text-lg">bolt</span>
            <span>Eventos y Recompensas</span>
          </button>
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-4 py-2 rounded-xl font-cinzel text-xs font-bold flex items-center space-x-2 transition-all ${
              activeTab === 'telemetry'
                ? 'bg-primary text-black shadow-[0_0_12px_var(--accent-glow)]'
                : 'text-gray-400 hover:text-white hover:bg-surface-card'
            }`}
          >
            <span className="material-symbols-outlined text-lg">terminal</span>
            <span>Telemetría Hardware</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/80 border border-red-500 text-red-200 p-4 rounded-xl flex items-center space-x-2">
          <span className="material-symbols-outlined">warning</span>
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: ROSTER & CHARACTER EDITOR */}
      {activeTab === 'roster' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {party.map((p) => (
            <div
              key={p.id}
              className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-5 hover:border-amber-500/70 transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-amber-200">{p.name}</h3>
                    <p className="text-slate-400 text-xs font-mono">@{ p.username || p.name.toLowerCase() }</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold font-serif bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {p.secret_class || p.secretClass}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 my-4 text-center">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400 block font-serif">NIVEL</span>
                    <span className="text-lg font-bold text-amber-400">{p.level}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400 block font-serif">XP</span>
                    <span className="text-lg font-bold text-purple-400">{p.xp}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400 block font-serif">ORO</span>
                    <span className="text-lg font-bold text-yellow-400">{p.gold}</span>
                  </div>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">NFC UID Tag:</span>
                    <span className="font-mono text-emerald-400 font-bold">{p.nfc_uid || p.nfcUid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Último escaneo:</span>
                    <span className="text-slate-300">
                      {p.last_scanned_at ? new Date(p.last_scanned_at).toLocaleTimeString() : 'Disponible'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick DM Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleQuickXP(p, 50)}
                    className="bg-purple-950/50 hover:bg-purple-900/60 text-purple-300 border border-purple-500/40 py-1.5 rounded-lg text-xs font-semibold"
                  >
                    +50 XP
                  </button>
                  <button
                    onClick={() => handleQuickGold(p, 50)}
                    className="bg-yellow-950/50 hover:bg-yellow-900/60 text-yellow-300 border border-yellow-500/40 py-1.5 rounded-lg text-xs font-semibold"
                  >
                    +50 Oro
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="flex-1 bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/40 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowGrantItemModal(p);
                      setGrantForm({ itemId: shopItems[0]?.id || '', quantity: 1 });
                    }}
                    className="flex-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1"
                  >
                    <span className="material-symbols-outlined text-sm">card_giftcard</span>
                    <span>Regalar</span>
                  </button>
                  <button
                    onClick={() => handleResetCooldown(p.id)}
                    title="Reset Cooldown"
                    className="bg-slate-800 hover:bg-slate-700 text-amber-400 p-1.5 rounded-lg text-xs"
                  >
                    <span className="material-symbols-outlined text-base">restart_alt</span>
                  </button>
                  <button
                    onClick={() => handleDeletePlayer(p.id, p.name)}
                    title="Eliminar Jugador"
                    className="bg-red-950/40 hover:bg-red-900 text-red-400 p-1.5 rounded-lg text-xs border border-red-500/30"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: SHOP CATALOG & ARTIFACT BUILDER */}
      {activeTab === 'shop' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Item Form */}
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-6 space-y-4">
            <h2 className="font-serif text-xl font-bold text-amber-300 flex items-center space-x-2">
              <span className="material-symbols-outlined">add_circle</span>
              <span>Crear Nuevo Artefacto Mágico</span>
            </h2>
            <form onSubmit={handleCreateItem} className="space-y-3">
              <div>
                <label className="text-xs font-serif text-slate-400">Nombre del Objeto</label>
                <input
                  type="text"
                  required
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  placeholder="Ej. Elixir de Erudición Suprena"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-amber-200 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-serif text-slate-400">Descripción</label>
                <textarea
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  placeholder="Efecto mágico del consumable..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-amber-200 focus:border-amber-500 focus:outline-none"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-serif text-slate-400">Precio (Oro)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-yellow-400 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-serif text-slate-400">Valor de Efecto</label>
                  <input
                    type="number"
                    value={itemForm.effectValue}
                    onChange={(e) => setItemForm({ ...itemForm, effectValue: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-purple-400 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-serif text-slate-400">Tipo de Efecto</label>
                <select
                  value={itemForm.type}
                  onChange={(e) => setItemForm({ ...itemForm, type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-amber-200 focus:border-amber-500 focus:outline-none"
                >
                  <option value="XP_BOOST">XP Boost (Multiplica XP)</option>
                  <option value="GOLD_BOOST">Gold Boost (Multiplica Oro)</option>
                  <option value="REROLL">Dado de la Fortuna (Re-Tirada)</option>
                  <option value="BUFF">Escudo / Protección contra Pifia</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-lg text-sm font-serif shadow-lg"
              >
                Añadir a la Tienda del Gremio
              </button>
            </form>
          </div>

          {/* Shop Item Catalog */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-serif text-xl font-bold text-amber-300">Catálogo de Artefactos de la Taberna</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shopItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex justify-between items-start space-x-3"
                >
                  <div className="flex items-start space-x-3">
                    <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg text-amber-400">
                      <span className="material-symbols-outlined text-2xl">{item.icon || 'shield'}</span>
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-amber-200">{item.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                      <div className="flex space-x-3 mt-2 text-xs font-semibold">
                        <span className="text-yellow-400">{item.price || item.gold_cost || 0} Oro</span>
                        <span className="text-purple-400">Efecto: +{item.effect_value || item.effectValue || 0}</span>
                        <span className="text-slate-400">({item.type || item.effect_type || 'BUFF'})</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteItem(item.id, item.name)}
                    className="text-slate-500 hover:text-red-400 p-1"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EVENTS & REWARDS BROADCASTER */}
      {activeTab === 'events' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Party Mass Rewards */}
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-6 space-y-4">
            <h2 className="font-serif text-xl font-bold text-amber-300 flex items-center space-x-2">
              <span className="material-symbols-outlined">card_giftcard</span>
              <span>Otorgar Recompensas a Toda la Party</span>
            </h2>
            <form onSubmit={handleGrantPartyRewards} className="space-y-4">
              <div>
                <label className="text-xs font-serif text-slate-400">Motivo de la Recompensa</label>
                <input
                  type="text"
                  required
                  value={rewardForm.reason}
                  onChange={(e) => setRewardForm({ ...rewardForm, reason: e.target.value })}
                  placeholder="Ej. Derrotar al Dragón Rojo"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-amber-200 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-serif text-slate-400">XP a cada aventurero</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={rewardForm.xp}
                    onChange={(e) => setRewardForm({ ...rewardForm, xp: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-purple-400 font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-serif text-slate-400">Oro a cada aventurero</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={rewardForm.gold}
                    onChange={(e) => setRewardForm({ ...rewardForm, gold: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-yellow-400 font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-lg text-sm font-serif shadow-lg"
              >
                ¡Repartir Botín a Todos!
              </button>
            </form>
          </div>

          {/* Tavern Global Buff Builder */}
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-6 space-y-4">
            <h2 className="font-serif text-xl font-bold text-amber-300 flex items-center space-x-2">
              <span className="material-symbols-outlined">local_bar</span>
              <span>Activar Buff Global de la Taberna</span>
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-serif text-slate-400">Nombre del Evento</label>
                <input
                  type="text"
                  value={buffForm.name}
                  onChange={(e) => setBuffForm({ ...buffForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-amber-200 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-serif text-slate-400">Multiplicador XP</label>
                  <input
                    type="number"
                    step="0.1"
                    value={buffForm.xpMultiplier}
                    onChange={(e) => setBuffForm({ ...buffForm, xpMultiplier: parseFloat(e.target.value) || 1.0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-purple-400 font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-serif text-slate-400">Multiplicador Oro</label>
                  <input
                    type="number"
                    step="0.1"
                    value={buffForm.goldMultiplier}
                    onChange={(e) => setBuffForm({ ...buffForm, goldMultiplier: parseFloat(e.target.value) || 1.0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-yellow-400 font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-serif text-slate-400">Duración (Minutos)</label>
                <input
                  type="number"
                  value={buffForm.durationMinutes}
                  onChange={(e) => setBuffForm({ ...buffForm, durationMinutes: parseInt(e.target.value) || 30 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-amber-200 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleTriggerBuff(true)}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-lg text-sm font-serif shadow-lg"
                >
                  ¡Encender Evento!
                </button>
                <button
                  onClick={() => handleTriggerBuff(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-lg text-sm font-serif"
                >
                  Apagar Evento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TELEMETRY & AUDIT TERMINAL */}
      {activeTab === 'telemetry' && telemetry && (
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-6 space-y-4">
          <h2 className="font-serif text-xl font-bold text-amber-300 flex items-center space-x-2">
            <span className="material-symbols-outlined text-emerald-400">memory</span>
            <span>Terminal de Escaneos Hardware & Telemetría ESP32</span>
          </h2>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-2 overflow-x-auto max-h-96 overflow-y-auto">
            <p className="text-emerald-400 font-bold">// Estado de Conexión MQTT Broker: ONLINE</p>
            {telemetry.recentAuditScanLogs?.map((log: any, idx: number) => (
              <div key={idx} className="border-b border-slate-800/60 pb-1">
                <span className="text-amber-400">[{new Date(log.created_at).toLocaleTimeString()}]</span>{' '}
                <span className="text-purple-300 font-bold">{log.player_name}</span> escaneó NFC Tag{' '}
                <span className="text-emerald-400 font-mono">{log.nfc_uid}</span> &rarr; Tirada:{' '}
                <span className="text-yellow-400 font-bold">d20: {log.raw_roll} (Total: {log.final_roll})</span> | +{log.xp_earned} XP | +{log.gold_earned} Oro
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL EDIT PLAYER */}
      {editingPlayer && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-amber-500/50 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-serif text-xl font-bold text-amber-300">Editar Personaje: {editingPlayer.name}</h3>
              <button onClick={() => setEditingPlayer(null)} className="text-slate-400 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSavePlayer} className="space-y-3 text-sm">
              <div>
                <label className="text-xs font-serif text-slate-400">Nombre Visible</label>
                <input
                  type="text"
                  value={playerForm.name}
                  onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-amber-200"
                />
              </div>
              <div>
                <label className="text-xs font-serif text-slate-400">Usuario Login</label>
                <input
                  type="text"
                  value={playerForm.username}
                  onChange={(e) => setPlayerForm({ ...playerForm, username: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-amber-200 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-serif text-slate-400">NFC UID Tag</label>
                <input
                  type="text"
                  value={playerForm.nfcUid}
                  onChange={(e) => setPlayerForm({ ...playerForm, nfcUid: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-emerald-400 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-serif text-slate-400">Clase Secreta</label>
                <select
                  value={playerForm.secretClass}
                  onChange={(e) => setPlayerForm({ ...playerForm, secretClass: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-amber-200 font-bold"
                >
                  <option value="ROGUE">Pícaro (Rogue - +30% Oro)</option>
                  <option value="MAGE">Mago (Mage - +30% XP)</option>
                  <option value="WARRIOR">Guerrero (Warrior - Suelo Roll &ge; 8)</option>
                  <option value="BARD">Bardo (Bard - +10% por Aliado)</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-serif text-slate-400">Nivel</label>
                  <input
                    type="number"
                    value={playerForm.level}
                    onChange={(e) => setPlayerForm({ ...playerForm, level: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-amber-400 font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-serif text-slate-400">XP</label>
                  <input
                    type="number"
                    value={playerForm.xp}
                    onChange={(e) => setPlayerForm({ ...playerForm, xp: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-purple-400 font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-serif text-slate-400">Oro</label>
                  <input
                    type="number"
                    value={playerForm.gold}
                    onChange={(e) => setPlayerForm({ ...playerForm, gold: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-yellow-400 font-bold"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-lg font-serif"
                >
                  Guardar Cambios
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPlayer(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREATE PLAYER */}
      {showCreatePlayerModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-amber-500/50 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-serif text-xl font-bold text-amber-300">Registrar Nuevo Aventurero</h3>
              <button onClick={() => setShowCreatePlayerModal(false)} className="text-slate-400 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreatePlayer} className="space-y-3 text-sm">
              <div>
                <label className="text-xs font-serif text-slate-400">Nombre del Personaje</label>
                <input
                  type="text"
                  required
                  value={playerForm.name}
                  onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })}
                  placeholder="Ej. Kaelen el Sombra"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-amber-200"
                />
              </div>
              <div>
                <label className="text-xs font-serif text-slate-400">Usuario para Login</label>
                <input
                  type="text"
                  value={playerForm.username}
                  onChange={(e) => setPlayerForm({ ...playerForm, username: e.target.value })}
                  placeholder="Ej. kaelen"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-amber-200 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-serif text-slate-400">NFC UID Tag Hardware</label>
                <input
                  type="text"
                  required
                  value={playerForm.nfcUid}
                  onChange={(e) => setPlayerForm({ ...playerForm, nfcUid: e.target.value })}
                  placeholder="Ej. 04A1B2C3D4E5"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-emerald-400 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-serif text-slate-400">Clase Secreta</label>
                <select
                  value={playerForm.secretClass}
                  onChange={(e) => setPlayerForm({ ...playerForm, secretClass: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-amber-200 font-bold"
                >
                  <option value="ROGUE">Pícaro (Rogue - +30% Oro)</option>
                  <option value="MAGE">Mago (Mage - +30% XP)</option>
                  <option value="WARRIOR">Guerrero (Warrior - Suelo Roll &ge; 8)</option>
                  <option value="BARD">Bardo (Bard - +10% por Aliado)</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 rounded-lg font-serif"
                >
                  Registrar Aventurero
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreatePlayerModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GRANT ITEM */}
      {showGrantItemModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-amber-500/50 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-serif text-xl font-bold text-amber-300">Regalar Artefacto a {showGrantItemModal.name}</h3>
              <button onClick={() => setShowGrantItemModal(null)} className="text-slate-400 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleGrantItemSubmit} className="space-y-3 text-sm">
              <div>
                <label className="text-xs font-serif text-slate-400">Seleccionar Artefacto</label>
                <select
                  value={grantForm.itemId}
                  onChange={(e) => setGrantForm({ ...grantForm, itemId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-amber-200 font-bold"
                >
                  {shopItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.price || item.gold_cost || 0} Oro / {item.type || item.effect_type || 'BUFF'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-serif text-slate-400">Cantidad</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={grantForm.quantity}
                  onChange={(e) => setGrantForm({ ...grantForm, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-amber-200 font-bold"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg font-serif"
                >
                  Entregar Objeto
                </button>
                <button
                  type="button"
                  onClick={() => setShowGrantItemModal(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
