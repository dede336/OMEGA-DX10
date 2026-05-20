export type AttributeId = 'VC' | 'VR' | 'DA' | 'NO' | 'UN';
export type ElementId = 'FIRE' | 'PLANT' | 'WATER' | 'WIND' | 'EARTH' | 'LIGHTNING' | 'LIGHT' | 'DARK' | 'NULL' | 'ICE';
export type RarityId = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'ULTRA';

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

export interface StageDrop {
  type: 'bits' | 'piece';
  id?: string;
  amount: number;
  chance: number;
}

export interface MapStage {
  index: number;
  name: string;
  enemyCharacterId: string;
  enemyLevel: number;
  expReward: number;
  drops?: StageDrop[];
}

export interface GameMap {
  id: string;
  name: string;
  description: string;
  requiredMapCleared?: string;
  requiredTamerLevel?: number;
  isDungeon?: boolean;
  backgroundImage?: number;
  stages: MapStage[];
}

// ─── Attributes ────────────────────────────────────────────────────────────────
export const ATTRIBUTES: Record<AttributeId, { label: string; abbr: string; color: string; beats: AttributeId | null; weakTo: AttributeId | null }> = {
  VC: { label: 'Vacina',       abbr: 'VC', color: '#22c55e', beats: 'VR', weakTo: 'DA' },
  VR: { label: 'Vírus',        abbr: 'VR', color: '#ef4444', beats: 'DA', weakTo: 'VC' },
  DA: { label: 'Data',         abbr: 'DA', color: '#3b82f6', beats: 'VC', weakTo: 'VR' },
  NO: { label: 'Nulo',         abbr: 'NO', color: '#6b7280', beats: null, weakTo: 'UN' },
  UN: { label: 'Desconhecido', abbr: 'UN', color: '#a855f7', beats: 'NO', weakTo: null },
};

// ─── Elements ──────────────────────────────────────────────────────────────────
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
  ICE:       { label: 'Gelo',      color: '#a8d8f0', beats: 'WIND',      weakTo: 'FIRE' },
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
  demiDevimon: {
    id: 'demiDevimon',
    name: 'DemiDevimon',
    rarity: 'COMMON',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 100, mp: 118, atk: 75, def: 67, spt: 63, spd: 64, apt: 22 },
    description: 'Um pequeno Digimon maligno do tipo Vírus. Usa suas asas e presas para atacar com poder das trevas.',
  },
  garurumon: {
    id: 'garurumon',
    name: 'Garurumon',
    rarity: 'RARE',
    attribute: 'VC',
    element: 'ICE',
    baseStats: { hp: 144, mp: 107, atk: 91, def: 80, spt: 53, spd: 61, apt: 22 },
    description: 'A evolução feroz do Gabumon. Um lobo de gelo do tipo Vacina com mandíbulas poderosas capazes de congelar qualquer inimigo.',
  },
  wereGarurumon: {
    id: 'wereGarurumon',
    name: 'WereGarurumon',
    rarity: 'EPIC',
    attribute: 'VC',
    element: 'ICE',
    baseStats: { hp: 200, mp: 220, atk: 130, def: 115, spt: 80, spd: 100, apt: 30 },
    description: 'A forma Ultimate do Garurumon. Um guerreiro humanoide do gelo com força devastadora e velocidade surpreendente.',
  },
  gulusGammamon: {
    id: 'gulusGammamon',
    name: 'GulusGammamon',
    rarity: 'RARE',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 145, mp: 130, atk: 115, def: 85, spt: 75, spd: 105, apt: 30 },
    description: 'A forma sombria do Gammamon. Um Digimon Champion do tipo Vírus corrompido pelas trevas, com velocidade e poder de ataque devastadores.',
  },
  greymon: {
    id: 'greymon',
    name: 'Greymon',
    rarity: 'RARE',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 170, mp: 165, atk: 115, def: 92, spt: 72, spd: 80, apt: 35 },
    description: 'A poderosa evolução do Agumon. Um Digimon de nível Champion do tipo Vacina com força de fogo devastadora.',
  },
  metalGreymon: {
    id: 'metalGreymon',
    name: 'MetalGreymon',
    rarity: 'EPIC',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 215, mp: 210, atk: 137, def: 117, spt: 94, spd: 100, apt: 51 },
    description: 'A forma Ultimate do Greymon. Metade de seu corpo foi reconstruído com metal cibernético, tornando-o um dos Digimon mais poderosos do tipo Vacina.',
  },
  warGreymon: {
    id: 'warGreymon',
    name: 'WarGreymon',
    rarity: 'LEGENDARY',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 320, mp: 335, atk: 171, def: 146, spt: 126, spd: 122, apt: 72 },
    description: 'O ápice da evolução do Agumon. Guerreiro lendário do tipo Vacina revestido por armadura Dramon Destroyer, capaz de destruir qualquer Dragonoid.',
  },
};

// ─── Evolution paths ──────────────────────────────────────────────────────────
export const EVOLUTIONS: Record<string, { evolvesTo: string; requiredLevel: number; label: string }> = {
  agumon:       { evolvesTo: 'greymon',       requiredLevel: 16, label: 'Greymon' },
  greymon:      { evolvesTo: 'metalGreymon',  requiredLevel: 34, label: 'MetalGreymon' },
  metalGreymon: { evolvesTo: 'warGreymon',    requiredLevel: 52, label: 'WarGreymon' },
  gabumon:      { evolvesTo: 'garurumon',     requiredLevel: 19, label: 'Garurumon' },
  garurumon:    { evolvesTo: 'wereGarurumon', requiredLevel: 35, label: 'WereGarurumon' },
};

// Characters that can be scanned (encountered as enemies in battle)
export const SCANNABLE_CHARACTERS: string[] = ['agumon', 'gabumon', 'demiDevimon'];

// Display order in the Codex (grouped by evolution line)
export const CODEX_ORDER: string[] = ['agumon', 'greymon', 'metalGreymon', 'warGreymon', 'gabumon', 'garurumon', 'wereGarurumon', 'demiDevimon', 'gulusGammamon'];

// ─── Maps & Stages ─────────────────────────────────────────────────────────────
export const GAME_MAPS: GameMap[] = [
  {
    id: 'map_forest',
    name: 'Chip Forest',
    description: 'Uma floresta de dados ancestrais onde Digimons selvagens habitam entre raízes digitais.',
    backgroundImage: require('../assets/images/maps/chip_forest.png'),
    stages: [
      { index: 0, name: 'Entrada da Floresta', enemyCharacterId: 'agumon',      enemyLevel: 1,  expReward: 40  },
      { index: 1, name: 'Clareira dos Dados',  enemyCharacterId: 'gabumon',     enemyLevel: 2,  expReward: 60  },
      { index: 2, name: 'Núcleo da Floresta',  enemyCharacterId: 'demiDevimon', enemyLevel: 4,  expReward: 100 },
    ],
  },
  {
    id: 'map_city',
    name: 'Cidade Cyber',
    description: 'Metrópole de circuitos onde Digimons evoluídos patrulham as ruas digitais.',
    requiredMapCleared: 'map_forest',
    stages: [
      { index: 0, name: 'Avenida dos Neons',   enemyCharacterId: 'gabumon',     enemyLevel: 5,  expReward: 130 },
      { index: 1, name: 'Setor Industrial',    enemyCharacterId: 'agumon',      enemyLevel: 7,  expReward: 160 },
      { index: 2, name: 'Torre Central',       enemyCharacterId: 'demiDevimon', enemyLevel: 9,  expReward: 220 },
    ],
  },
  {
    id: 'map_shadow',
    name: 'Domínio das Sombras',
    description: 'Uma dimensão corrompida onde as trevas consomem tudo. Apenas os mais fortes sobrevivem.',
    requiredMapCleared: 'map_city',
    stages: [
      { index: 0, name: 'Portal das Trevas',   enemyCharacterId: 'demiDevimon', enemyLevel: 12, expReward: 280 },
      { index: 1, name: 'Abismo Corrompido',   enemyCharacterId: 'agumon',      enemyLevel: 14, expReward: 340 },
      { index: 2, name: 'Trono do Caos',       enemyCharacterId: 'gabumon',     enemyLevel: 16, expReward: 450 },
    ],
  },
  {
    id: 'dungeon_gulus',
    name: 'Covil do Gulus',
    description: 'Uma dungeon sombria onde GulusGammamon reina. Derrote-o para obter Bits e Fragmentos da Coragem.',
    isDungeon: true,
    requiredTamerLevel: 25,
    backgroundImage: require('../assets/images/maps/dungeon_gulus.png'),
    stages: [
      {
        index: 0,
        name: 'Boss — GulusGammamon',
        enemyCharacterId: 'gulusGammamon',
        enemyLevel: 25,
        expReward: 500,
        drops: [
          { type: 'bits',  amount: 1000, chance: 1.00 },
          { type: 'piece', id: 'piece_brasao_coragem', amount: 1, chance: 0.10 },
        ],
      },
    ],
  },
];

export const RARITY_COLORS: Record<RarityId, string> = {
  COMMON:    '#94a3b8',
  RARE:      '#3b82f6',
  EPIC:      '#8b5cf6',
  LEGENDARY: '#f59e0b',
  ULTRA:     '#ff3c6e',
};

export const RARITY_LABELS: Record<RarityId, string> = {
  COMMON:    'Rookie',
  RARE:      'Champion',
  EPIC:      'Ultimate',
  LEGENDARY: 'Mega',
  ULTRA:     'Ultra',
};

// ─── Tamer Equipment ──────────────────────────────────────────────────────────
export type EquipSlot = 'blusa' | 'calca' | 'sapato' | 'brasao' | 'digivice' | 'pulseira' | 'oculos';
export type TamerGender = 'M' | 'F' | 'N';

export interface ElementBonus {
  element: ElementId;
  percent: number;
}

export interface EquipItem {
  id: string;
  name: string;
  slot: EquipSlot;
  rarity: RarityId;
  description: string;
  bonuses: Partial<BaseStats>;
  elementBonus?: ElementBonus;
}

export const EQUIP_SLOT_LABELS: Record<EquipSlot, string> = {
  blusa:    'Blusa',
  calca:    'Calça',
  sapato:   'Sapato',
  brasao:   'Brasão',
  digivice: 'Digivice',
  pulseira: 'Pulseira',
  oculos:   'Óculos',
};

export const EQUIP_SLOT_ICONS: Record<EquipSlot, string> = {
  blusa:    'wind',
  calca:    'align-justify',
  sapato:   'chevrons-down',
  brasao:   'shield',
  digivice: 'cpu',
  pulseira: 'link',
  oculos:   'eye',
};

export const EQUIPMENT_ITEMS: EquipItem[] = [
  { id: 'blusa_tamer',    name: 'Camiseta de Tamer',  slot: 'blusa',    rarity: 'COMMON',    description: 'Camiseta padrão dos Tamers. Aumenta o ataque do parceiro.',          bonuses: { atk: 5 } },
  { id: 'blusa_jaqueta',  name: 'Jaqueta Tática',     slot: 'blusa',    rarity: 'RARE',      description: 'Jaqueta reforçada com chip de dados embutido.',                     bonuses: { atk: 10, def: 5 } },
  { id: 'calca_treino',   name: 'Calça de Treino',    slot: 'calca',    rarity: 'COMMON',    description: 'Calça confortável para treinamento. Aumenta a defesa.',              bonuses: { def: 5 } },
  { id: 'calca_tatica',   name: 'Calça Tática',       slot: 'calca',    rarity: 'RARE',      description: 'Calça reforçada com fibra digital de alto grau.',                   bonuses: { def: 12, spd: 3 } },
  { id: 'sapato_tenis',   name: 'Tênis de Corrida',   slot: 'sapato',   rarity: 'COMMON',    description: 'Leve e rápido. Aumenta a velocidade do parceiro.',                  bonuses: { spd: 6 } },
  { id: 'sapato_botas',   name: 'Botas de Batalha',   slot: 'sapato',   rarity: 'RARE',      description: 'Botas robustas para batalhas intensas.',                            bonuses: { spd: 8, def: 6 } },
  { id: 'brasao_digital',  name: 'Brasão Digital',      slot: 'brasao',   rarity: 'COMMON',    description: 'Símbolo de um Tamer legítimo. Aumenta o HP do parceiro.',                           bonuses: { hp: 15 } },
  { id: 'brasao_elite',    name: 'Brasão de Elite',     slot: 'brasao',   rarity: 'EPIC',      description: 'Concedido apenas aos melhores Tamers do mundo digital.',                            bonuses: { hp: 35, mp: 20 } },
  { id: 'brasao_coragem',  name: 'Brasão da Coragem',   slot: 'brasao',   rarity: 'LEGENDARY', description: 'O Brasão da Coragem de Tai. Aumenta em 20% todos os status de Digimon do tipo Fogo.', bonuses: {}, elementBonus: { element: 'FIRE', percent: 0.20 } },
  { id: 'digivice_d3',    name: 'Digivice D-3',       slot: 'digivice', rarity: 'COMMON',    description: 'Digivice padrão. Potencializa o espírito do parceiro.',             bonuses: { spt: 6 } },
  { id: 'digivice_x',    name: 'Digivice X',          slot: 'digivice', rarity: 'LEGENDARY', description: 'Versão X do Digivice. Poder muito além dos limites conhecidos.',    bonuses: { spt: 20, atk: 12, mp: 25 } },
  { id: 'pulseira_forca', name: 'Pulseira de Força',  slot: 'pulseira', rarity: 'COMMON',    description: 'Amplifica a força bruta do Digimon parceiro.',                      bonuses: { atk: 7 } },
  { id: 'pulseira_ouro',  name: 'Pulseira Dourada',   slot: 'pulseira', rarity: 'RARE',      description: 'Pulseira lendária que amplifica múltiplos atributos de batalha.',   bonuses: { atk: 10, spt: 8 } },
  { id: 'oculos_scanner', name: 'Óculos de Scanner',  slot: 'oculos',   rarity: 'COMMON',    description: 'Analisa inimigos em tempo real. Aumenta o MP do parceiro.',         bonuses: { mp: 8 } },
  { id: 'oculos_tatico',  name: 'Óculos Tático',      slot: 'oculos',   rarity: 'RARE',      description: 'Óculos com HUD digital avançado e sistema de mira.',                bonuses: { mp: 15, apt: 5 } },
];

export const EQUIP_SLOTS_ORDER: EquipSlot[] = ['blusa', 'calca', 'sapato', 'brasao', 'digivice', 'pulseira', 'oculos'];

export const DEFAULT_INVENTORY: string[] = [
  'blusa_tamer', 'calca_treino', 'sapato_tenis', 'brasao_digital', 'digivice_d3', 'pulseira_forca', 'oculos_scanner',
];

// ─── Crafting / Pieces ─────────────────────────────────────────────────────────
export interface CraftRecipe {
  pieceId: string;
  pieceName: string;
  pieceDescription: string;
  requiredCount: number;
  resultItemId: string;
  resultItemName: string;
}

export const CRAFT_RECIPES: CraftRecipe[] = [
  {
    pieceId: 'piece_brasao_coragem',
    pieceName: 'Fragmento da Coragem',
    pieceDescription: 'Um fragmento do lendário Brasão da Coragem. Colete 50 para forjar o item completo.',
    requiredCount: 50,
    resultItemId: 'brasao_coragem',
    resultItemName: 'Brasão da Coragem',
  },
];

export function expToNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.15, level - 1));
}

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
