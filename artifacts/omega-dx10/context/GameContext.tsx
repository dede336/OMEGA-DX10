import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  CHARACTERS, EVOLUTIONS, GAME_MAPS, expToNextLevel,
  EquipSlot, TamerGender, EQUIP_SLOTS_ORDER, DEFAULT_INVENTORY,
} from '@/constants/gameData';

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

interface GameState {
  playerName: string;
  gender: TamerGender;
  collection: OwnedCharacter[];
  clearedStages: Record<string, boolean>;
  selectedOwnedId: string | null;
  scanProgress: Record<string, number>;
  inventory: string[];
  equippedItems: EquippedItems;
}

interface GameContextValue extends GameState {
  selectedCharacter: OwnedCharacter | null;
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
  totalPlayerLevel: number;
  setGender: (g: TamerGender) => void;
  equipItem: (slot: EquipSlot, itemId: string) => void;
  unequipItem: (slot: EquipSlot) => void;
  totalEquipBonus: () => Partial<Record<string, number>>;
}

const STORAGE_KEY = 'omega_dx10_save_v2';

const defaultState: GameState = {
  playerName: 'Tamer',
  gender: 'M',
  collection: [{ ownedId: 'owned_agumon_0', characterId: 'agumon', level: 1, exp: 0 }],
  clearedStages: {},
  selectedOwnedId: 'owned_agumon_0',
  scanProgress: {},
  inventory: DEFAULT_INVENTORY,
  equippedItems: defaultEquipped,
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(defaultState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<GameState>;
          setState({
            ...defaultState,
            ...parsed,
            scanProgress: parsed.scanProgress ?? {},
            gender: parsed.gender ?? 'M',
            inventory: parsed.inventory ?? DEFAULT_INVENTORY,
            equippedItems: { ...defaultEquipped, ...(parsed.equippedItems ?? {}) },
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

  const isStageCleared = useCallback(
    (mapId: string, stageIndex: number) => {
      return !!state.clearedStages[`${mapId}-${stageIndex}`];
    },
    [state.clearedStages],
  );

  const isMapUnlocked = useCallback(
    (mapId: string) => {
      const map = GAME_MAPS.find((m) => m.id === mapId);
      if (!map?.requiredMapCleared) return true;
      const required = GAME_MAPS.find((m) => m.id === map.requiredMapCleared);
      if (!required) return false;
      return required.stages.every((s) => state.clearedStages[`${map.requiredMapCleared}-${s.index}`]);
    },
    [state.clearedStages],
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

  const totalPlayerLevel = Math.max(1, Math.floor(
    state.collection.reduce((sum, c) => sum + c.level, 0) / Math.max(1, state.collection.length),
  ));

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
        totalPlayerLevel,
        setGender,
        equipItem,
        unequipItem,
        totalEquipBonus,
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
