export type AttributeId = 'VC' | 'VR' | 'DA' | 'NO' | 'UN';
export type ElementId = 'FIRE' | 'PLANT' | 'WATER' | 'WIND' | 'EARTH' | 'LIGHTNING' | 'LIGHT' | 'DARK' | 'NULL';
export type RarityId = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface BaseStats {
  hp: number;
  mp: number;
  atk: number;
  def: number;
  spt: number;
  spd: number;
  apt: number;
}

export interface Character {
  id: string;
  name: string;
  rarity: RarityId;
  attribute: AttributeId;
  element: ElementId;
  baseStats: BaseStats;
  description: string;
}

export interface MapStage {
  index: number;
  name: string;
  enemyCharacterId: string;
  enemyLevel: number;
  expReward: number;
  unlockCharacterId?: string;
}

export interface GameMap {
  id: string;
  name: string;
  description: string;
  requiredMapCleared?: string;
  stages: MapStage[];
}

// ─── Attributes ────────────────────────────────────────────────────────────────
// VC beats VR, VR beats DA, DA beats VC (triangle)
// UN beats NO, UN has no weakness
export const ATTRIBUTES: Record<AttributeId, { label: string; abbr: string; color: string; beats: AttributeId | null; weakTo: AttributeId | null }> = {
  VC: { label: 'Vacina',       abbr: 'VC', color: '#22c55e', beats: 'VR', weakTo: 'DA' },
  VR: { label: 'Vírus',        abbr: 'VR', color: '#ef4444', beats: 'DA', weakTo: 'VC' },
  DA: { label: 'Data',         abbr: 'DA', color: '#3b82f6', beats: 'VC', weakTo: 'VR' },
  NO: { label: 'Nulo',         abbr: 'NO', color: '#6b7280', beats: null, weakTo: 'UN' },
  UN: { label: 'Desconhecido', abbr: 'UN', color: '#a855f7', beats: 'NO', weakTo: null },
};

// ─── Elements ──────────────────────────────────────────────────────────────────
// FIRE>PLANT>WATER>FIRE | WIND>EARTH>LIGHTNING>WIND | LIGHT<>DARK | NULL=neutral
export const ELEMENTS: Record<ElementId, { label: string; color: string; beats: ElementId | null; weakTo: ElementId | null }> = {
  FIRE:      { label: 'Fogo',      color: '#ff6b35', beats: 'PLANT',     weakTo: 'WATER' },
  PLANT:     { label: 'Planta',    color: '#22c55e', beats: 'WATER',     weakTo: 'FIRE' },
  WATER:     { label: 'Água',      color: '#3b82f6', beats: 'FIRE',      weakTo: 'PLANT' },
  WIND:      { label: 'Vento',     color: '#84cc16', beats: 'EARTH',     weakTo: 'LIGHTNING' },
  EARTH:     { label: 'Terra',     color: '#a16207', beats: 'LIGHTNING', weakTo: 'WIND' },
  LIGHTNING: { label: 'Raio',      color: '#facc15', beats: 'WIND',      weakTo: 'EARTH' },
  LIGHT:     { label: 'Luz',       color: '#fde68a', beats: 'DARK',      weakTo: 'DARK' },
  DARK:      { label: 'Trevas',    color: '#8b5cf6', beats: 'LIGHT',     weakTo: 'LIGHT' },
  NULL:      { label: 'Nulo',      color: '#6b7280', beats: null,        weakTo: null },
};

// ─── Characters ───────────────────────────────────────────────────────────────
export const CHARACTERS: Record<string, Character> = {
  agumon: {
    id: 'agumon',
    name: 'Agumon',
    rarity: 'COMMON',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 135, mp: 132, atk: 88, def: 73, spt: 60, spd: 66, apt: 40 },
    description: 'Um dinossauro digital corajoso do tipo Vacina. Domina o fogo e possui força física notável.',
  },
  gabumon: {
    id: 'gabumon',
    name: 'Gabumon',
    rarity: 'COMMON',
    attribute: 'DA',
    element: 'WATER',
    baseStats: { hp: 113, mp: 102, atk: 86, def: 59, spt: 53, spd: 63, apt: 22 },
    description: 'Um Digimon do tipo Data coberto por pele de lobo azul. Controla as forças da água.',
  },
  devimon: {
    id: 'devimon',
    name: 'Devimon',
    rarity: 'COMMON',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 100, mp: 118, atk: 75, def: 67, spt: 63, spd: 64, apt: 22 },
    description: 'Um Digimon maligno do tipo Vírus. Manipula as trevas com poder espiritual elevado.',
  },
};

// ─── Maps & Stages ─────────────────────────────────────────────────────────────
export const GAME_MAPS: GameMap[] = [
  {
    id: 'map_forest',
    name: 'Floresta Digital',
    description: 'Bosques de dados fragmentados habitados por Digimons selvagens.',
    stages: [
      { index: 0, name: 'Entrada da Floresta', enemyCharacterId: 'agumon',  enemyLevel: 1, expReward: 40,  unlockCharacterId: 'gabumon' },
      { index: 1, name: 'Clareira dos Dados',  enemyCharacterId: 'gabumon', enemyLevel: 2, expReward: 60,  unlockCharacterId: 'devimon' },
      { index: 2, name: 'Núcleo da Floresta',  enemyCharacterId: 'devimon', enemyLevel: 4, expReward: 100 },
    ],
  },
  {
    id: 'map_city',
    name: 'Cidade Cyber',
    description: 'Metrópole de circuitos onde Digimons evoluídos patrulham as ruas digitais.',
    requiredMapCleared: 'map_forest',
    stages: [
      { index: 0, name: 'Avenida dos Neons',   enemyCharacterId: 'gabumon', enemyLevel: 5, expReward: 130 },
      { index: 1, name: 'Setor Industrial',    enemyCharacterId: 'agumon',  enemyLevel: 7, expReward: 160 },
      { index: 2, name: 'Torre Central',       enemyCharacterId: 'devimon', enemyLevel: 9, expReward: 220 },
    ],
  },
  {
    id: 'map_shadow',
    name: 'Domínio das Sombras',
    description: 'Uma dimensão corrompida onde as trevas consomem tudo. Apenas os mais fortes sobrevivem.',
    requiredMapCleared: 'map_city',
    stages: [
      { index: 0, name: 'Portal das Trevas',  enemyCharacterId: 'devimon', enemyLevel: 12, expReward: 280 },
      { index: 1, name: 'Abismo Corrompido', enemyCharacterId: 'agumon',  enemyLevel: 14, expReward: 340 },
      { index: 2, name: 'Trono do Caos',     enemyCharacterId: 'gabumon', enemyLevel: 16, expReward: 450 },
    ],
  },
];

export const RARITY_COLORS: Record<RarityId, string> = {
  COMMON:    '#94a3b8',
  RARE:      '#3b82f6',
  EPIC:      '#8b5cf6',
  LEGENDARY: '#f59e0b',
};

export const RARITY_LABELS: Record<RarityId, string> = {
  COMMON:    'Comum',
  RARE:      'Raro',
  EPIC:      'Épico',
  LEGENDARY: 'Lendário',
};

// EXP needed to reach next level
export function expToNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.15, level - 1));
}

// Scale stats by level (5% per level)
export function getScaledStats(base: BaseStats, level: number): BaseStats {
  const mult = 1 + (level - 1) * 0.05;
  return {
    hp:  Math.floor(base.hp  * mult),
    mp:  Math.floor(base.mp  * mult),
    atk: Math.floor(base.atk * mult),
    def: Math.floor(base.def * mult),
    spt: Math.floor(base.spt * mult),
    spd: Math.floor(base.spd * mult),
    apt: Math.floor(base.apt * mult),
  };
}
