import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  CHARACTERS, EVOLUTIONS, FUSIONS, GAME_MAPS, expToNextLevel, tamerExpToNextLevel,
  EquipSlot, TamerGender, EQUIP_SLOTS_ORDER, DEFAULT_INVENTORY,
  CRAFT_RECIPES, CraftRecipe,
} from '@/constants/gameData';

export interface MailReward {
  bits?: number;
  items?: string[];
  digimon?: string[];
}

export interface MailMessage {
  id: string;
  title: string;
  body: string;
  reward?: MailReward;
  rewardClaimed: boolean;
  isRead: boolean;
  createdAt: number;
  unlocksAtTamerLevel?: number;
}

export interface OwnedCharacter {
  ownedId: string;
  characterId: string;
  level: number;
  exp: number;
}

type EquippedItems = Record<EquipSlot, string | null>;

const defaultEquipped: EquippedItems = {
  blusa: null, calca: null, sapato: null,
  brasao: null, digivice: null, pulseira: null, oculos: null,
};

const DEFAULT_MESSAGES: MailMessage[] = [
  {
    id: 'welcome_v1',
    title: 'Bem-vindo ao OMEGA DX10!',
    body: 'Olá, Tamer! Sua jornada pelo Mundo Digital começa agora. Aqui você receberá recompensas especiais do administrador. Boa sorte em suas batalhas!',
    reward: { bits: 500 },
    rewardClaimed: false,
    isRead: false,
    createdAt: 1716000000000,
  },
  {
    id: 'agumon_saver_gift_v1',
    title: 'Presente de Nível 5 — Agumon (Saver)!',
    body: 'Parabéns por atingir o Tamer Rank 5! Como recompensa especial, você recebe o Agumon (Saver) — uma variante poderosa do Agumon com ataque e defesa superiores. Boa sorte nas batalhas!',
    reward: { digimon: ['agumonSaver'] },
    rewardClaimed: false,
    isRead: false,
    createdAt: 1716000001000,
    unlocksAtTamerLevel: 5,
  },
];

interface GameState {
  playerName: string;
  gender: TamerGender;
  tamerId: string | null;
  isOnboarded: boolean;
  collection: OwnedCharacter[];
  clearedStages: Record<string, boolean>;
  selectedOwnedId: string | null;
  scanProgress: Record<string, number>;
  inventory: string[];
  equippedItems: EquippedItems;
  pieces: Record<string, number>;
  bits: number;
  tamerExp: number;
  tamerLevel: number;
  messages: MailMessage[];
}

interface GameContextValue extends GameState {
  isLoaded: boolean;
  selectedCharacter: OwnedCharacter | null;
  completeOnboarding: (name: string, gender: TamerGender, tamerId: string) => void;
  addToCollection: (characterId: string) => void;
  gainExp: (ownedId: string, amount: number) => void;
  clearStage: (mapId: string, stageIndex: number) => void;
  setSelectedCharacter: (ownedId: string) => void;
  setPlayerName: (name: string) => void;
  isStageCleared: (mapId: string, stageIndex: number) => boolean;
  isMapUnlocked: (mapId: string) => boolean;
  gainScan: (characterId: string, amount: number) => void;
  createFromScan: (characterId: string) => void;
  evolveDigimon: (ownedId: string) => void;
  fuseDigimon: (keepOwnedId: string, sacrificeOwnedId: string) => boolean;
  totalPlayerLevel: number;
  setGender: (g: TamerGender) => void;
  equipItem: (slot: EquipSlot, itemId: string) => void;
  unequipItem: (slot: EquipSlot) => void;
  totalEquipBonus: () => Partial<Record<string, number>>;
  gainPiece: (pieceId: string, amount?: number) => void;
  craftItem: (recipe: CraftRecipe) => boolean;
  gainBits: (amount: number) => void;
  gainTamerExp: (amount: number) => void;
  addToInventory: (itemId: string) => void;
  unreadMailCount: number;
  readMessage: (id: string) => void;
  claimReward: (id: string) => void;
}

const STORAGE_KEY = 'omega_dx10_save_v2';

const defaultState: GameState = {
  playerName: '',
  gender: 'M',
  tamerId: null,
  isOnboarded: false,
  collection: [{ ownedId: 'owned_agumon_0', characterId: 'agumon', level: 1, exp: 0 }],
  clearedStages: {},
  selectedOwnedId: 'owned_agumon_0',
  scanProgress: {},
  inventory: DEFAULT_INVENTORY,
  equippedItems: defaultEquipped,
  pieces: {},
  bits: 0,
  tamerExp: 0,
  tamerLevel: 1,
  messages: DEFAULT_MESSAGES,
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(defaultState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<GameState & { playerName?: string }>;
          const hadPreviousSave = !!parsed.playerName && parsed.playerName !== '';
          const savedMessages: MailMessage[] = parsed.messages ?? [];
          const savedIds = new Set(savedMessages.map((m) => m.id));
          const merged = [
            ...DEFAULT_MESSAGES.filter((m) => !savedIds.has(m.id)),
            ...savedMessages,
          ].sort((a, b) => b.createdAt - a.createdAt);
          setState({
            ...defaultState,
            ...parsed,
            scanProgress: parsed.scanProgress ?? {},
            gender: parsed.gender ?? 'M',
            inventory: parsed.inventory ?? DEFAULT_INVENTORY,
            equippedItems: { ...defaultEquipped, ...(parsed.equippedItems ?? {}) },
            pieces: parsed.pieces ?? {},
            bits: parsed.bits ?? 0,
            tamerExp: parsed.tamerExp ?? 0,
            tamerLevel: parsed.tamerLevel ?? 1,
            tamerId: parsed.tamerId ?? null,
            isOnboarded: parsed.isOnboarded ?? hadPreviousSave,
            messages: merged,
          });
        } catch {}
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, loaded]);

  const addToCollection = useCallback((characterId: string) => {
    setState((prev) => {
      if (prev.collection.some((c) => c.characterId === characterId)) return prev;
      if (prev.collection.length >= 100) return prev;
      const ownedId = `owned_${characterId}_${Date.now()}`;
      const newChar: OwnedCharacter = { ownedId, characterId, level: 1, exp: 0 };
      return { ...prev, collection: [...prev.collection, newChar] };
    });
  }, []);

  const gainExp = useCallback((ownedId: string, amount: number) => {
    setState((prev) => {
      const updated = prev.collection.map((c) => {
        if (c.ownedId !== ownedId) return c;
        let { exp, level } = c;
        exp += amount;
        while (exp >= expToNextLevel(level)) {
          exp -= expToNextLevel(level);
          level += 1;
        }
        return { ...c, exp, level };
      });
      return { ...prev, collection: updated };
    });
  }, []);

  const clearStage = useCallback((mapId: string, stageIndex: number) => {
    const key = `${mapId}-${stageIndex}`;
    setState((prev) => {
      if (prev.clearedStages[key]) return prev;
      const clearedStages = { ...prev.clearedStages, [key]: true };
      return { ...prev, clearedStages };
    });
  }, []);

  const gainScan = useCallback((characterId: string, amount: number) => {
    setState((prev) => {
      const current = prev.scanProgress[characterId] ?? 0;
      if (current >= 100) return prev;
      const next = Math.min(100, current + amount);
      return { ...prev, scanProgress: { ...prev.scanProgress, [characterId]: next } };
    });
  }, []);

  const createFromScan = useCallback((characterId: string) => {
    setState((prev) => {
      const scan = prev.scanProgress[characterId] ?? 0;
      if (scan < 100) return prev;
      if (prev.collection.some((c) => c.characterId === characterId)) return prev;
      if (prev.collection.length >= 100) return prev;
      const ownedId = `owned_${characterId}_${Date.now()}`;
      return {
        ...prev,
        collection: [...prev.collection, { ownedId, characterId, level: 1, exp: 0 }],
      };
    });
  }, []);

  const evolveDigimon = useCallback((ownedId: string) => {
    setState((prev) => {
      const updated = prev.collection.map((c) => {
        if (c.ownedId !== ownedId) return c;
        const evo = EVOLUTIONS[c.characterId];
        if (!evo || c.level < evo.requiredLevel) return c;
        return { ...c, characterId: evo.evolvesTo, level: 1, exp: 0 };
      });
      return { ...prev, collection: updated };
    });
  }, []);

  const fuseDigimon = useCallback((keepOwnedId: string, sacrificeOwnedId: string): boolean => {
    let success = false;
    setState((prev) => {
      const keep = prev.collection.find((c) => c.ownedId === keepOwnedId);
      const sacrifice = prev.collection.find((c) => c.ownedId === sacrificeOwnedId);
      if (!keep || !sacrifice) return prev;
      const fusion = FUSIONS[keep.characterId];
      if (!fusion || fusion.partner !== sacrifice.characterId) return prev;
      success = true;
      const newSelected = prev.selectedOwnedId === sacrificeOwnedId ? keepOwnedId : prev.selectedOwnedId;
      return {
        ...prev,
        selectedOwnedId: newSelected,
        collection: prev.collection
          .filter((c) => c.ownedId !== sacrificeOwnedId)
          .map((c) => c.ownedId === keepOwnedId ? { ...c, characterId: fusion.resultId, level: 1, exp: 0 } : c),
      };
    });
    return success;
  }, []);

  const setSelectedCharacter = useCallback((ownedId: string) => {
    setState((prev) => ({ ...prev, selectedOwnedId: ownedId }));
  }, []);

  const setPlayerName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, playerName: name }));
  }, []);

  const setGender = useCallback((g: TamerGender) => {
    setState((prev) => ({ ...prev, gender: g }));
  }, []);

  const equipItem = useCallback((slot: EquipSlot, itemId: string) => {
    setState((prev) => ({
      ...prev,
      equippedItems: { ...prev.equippedItems, [slot]: itemId },
    }));
  }, []);

  const unequipItem = useCallback((slot: EquipSlot) => {
    setState((prev) => ({
      ...prev,
      equippedItems: { ...prev.equippedItems, [slot]: null },
    }));
  }, []);

  const completeOnboarding = useCallback((name: string, gender: TamerGender, tamerId: string) => {
    setState((prev) => ({ ...prev, playerName: name, gender, tamerId, isOnboarded: true }));
  }, []);

  const gainBits = useCallback((amount: number) => {
    setState((prev) => ({ ...prev, bits: prev.bits + amount }));
  }, []);

  const gainTamerExp = useCallback((amount: number) => {
    setState((prev) => {
      let { tamerExp, tamerLevel } = prev;
      tamerExp += amount;
      while (tamerExp >= tamerExpToNextLevel(tamerLevel)) {
        tamerExp -= tamerExpToNextLevel(tamerLevel);
        tamerLevel += 1;
      }
      return { ...prev, tamerExp, tamerLevel };
    });
  }, []);

  const addToInventory = useCallback((itemId: string) => {
    setState((prev) => {
      if (prev.inventory.includes(itemId)) return prev;
      return { ...prev, inventory: [...prev.inventory, itemId] };
    });
  }, []);

  const readMessage = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      messages: prev.messages.map((m) => m.id === id ? { ...m, isRead: true } : m),
    }));
  }, []);

  const claimReward = useCallback((id: string) => {
    setState((prev) => {
      const msg = prev.messages.find((m) => m.id === id);
      if (!msg || msg.rewardClaimed) return prev;
      let newBits = prev.bits;
      let newInventory = [...prev.inventory];
      let newCollection = [...prev.collection];
      if (msg.reward?.bits) newBits += msg.reward.bits;
      if (msg.reward?.items) {
        for (const itemId of msg.reward.items) {
          if (!newInventory.includes(itemId)) newInventory.push(itemId);
        }
      }
      if (msg.reward?.digimon) {
        for (const characterId of msg.reward.digimon) {
          const alreadyOwned = newCollection.some((c) => c.characterId === characterId);
          if (!alreadyOwned && newCollection.length < 100) {
            const ownedId = `owned_${characterId}_${Date.now()}`;
            newCollection.push({ ownedId, characterId, level: 1, exp: 0 });
          }
        }
      }
      return {
        ...prev,
        bits: newBits,
        inventory: newInventory,
        collection: newCollection,
        messages: prev.messages.map((m) =>
          m.id === id ? { ...m, isRead: true, rewardClaimed: true } : m
        ),
      };
    });
  }, []);

  const gainPiece = useCallback((pieceId: string, amount = 1) => {
    setState((prev) => ({
      ...prev,
      pieces: { ...prev.pieces, [pieceId]: (prev.pieces[pieceId] ?? 0) + amount },
    }));
  }, []);

  const craftItem = useCallback((recipe: CraftRecipe): boolean => {
    let success = false;
    setState((prev) => {
      if (prev.inventory.includes(recipe.resultItemId)) return prev;
      if ((recipe.bitsCost ?? 0) > 0 && prev.bits < (recipe.bitsCost ?? 0)) return prev;

      const newPieces = { ...prev.pieces };

      if (recipe.pieceRequirements && recipe.pieceRequirements.length > 0) {
        for (const req of recipe.pieceRequirements) {
          if ((prev.pieces[req.pieceId] ?? 0) < req.count) return prev;
        }
        for (const req of recipe.pieceRequirements) {
          newPieces[req.pieceId] = (newPieces[req.pieceId] ?? 0) - req.count;
        }
      } else {
        const current = prev.pieces[recipe.pieceId] ?? 0;
        if (current < recipe.requiredCount) return prev;
        newPieces[recipe.pieceId] = current - recipe.requiredCount;
      }

      success = true;
      return {
        ...prev,
        pieces: newPieces,
        bits: prev.bits - (recipe.bitsCost ?? 0),
        inventory: [...prev.inventory, recipe.resultItemId],
      };
    });
    return success;
  }, []);

  const isStageCleared = useCallback(
    (mapId: string, stageIndex: number) => {
      return !!state.clearedStages[`${mapId}-${stageIndex}`];
    },
    [state.clearedStages],
  );

  const isMapUnlocked = useCallback(
    (mapId: string) => {
      const map = GAME_MAPS.find((m) => m.id === mapId);
      if (!map) return false;
      if (map.requiredTamerLevel) {
        if (state.tamerLevel < map.requiredTamerLevel) return false;
      }
      if (!map.requiredMapCleared) return true;
      const required = GAME_MAPS.find((m) => m.id === map.requiredMapCleared);
      if (!required) return false;
      return required.stages.every((s) => state.clearedStages[`${map.requiredMapCleared}-${s.index}`]);
    },
    [state.clearedStages, state.collection],
  );

  const totalEquipBonus = useCallback((): Partial<Record<string, number>> => {
    const { EQUIPMENT_ITEMS } = require('@/constants/gameData');
    const result: Record<string, number> = {};
    EQUIP_SLOTS_ORDER.forEach((slot) => {
      const itemId = state.equippedItems[slot];
      if (!itemId) return;
      const item = EQUIPMENT_ITEMS.find((i: { id: string }) => i.id === itemId);
      if (!item) return;
      Object.entries(item.bonuses as Record<string, number>).forEach(([k, v]) => {
        result[k] = (result[k] ?? 0) + (v as number);
      });
    });
    return result;
  }, [state.equippedItems]);

  const totalPlayerLevel = state.tamerLevel;
  const unreadMailCount = state.messages.filter(
    (m) => !m.isRead && (!m.unlocksAtTamerLevel || state.tamerLevel >= m.unlocksAtTamerLevel)
  ).length;

  const selectedCharacter = state.collection.find((c) => c.ownedId === state.selectedOwnedId) ?? null;

  return (
    <GameContext.Provider
      value={{
        ...state,
        selectedCharacter,
        addToCollection,
        gainExp,
        clearStage,
        setSelectedCharacter,
        setPlayerName,
        isStageCleared,
        isMapUnlocked,
        gainScan,
        createFromScan,
        evolveDigimon,
        fuseDigimon,
        totalPlayerLevel,
        setGender,
        equipItem,
        unequipItem,
        totalEquipBonus,
        gainPiece,
        craftItem,
        gainBits,
        gainTamerExp,
        addToInventory,
        isLoaded: loaded,
        completeOnboarding,
        unreadMailCount,
        readMessage,
        claimReward,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
