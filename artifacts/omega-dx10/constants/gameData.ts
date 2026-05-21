export type AttributeId = 'VC' | 'VR' | 'DA' | 'NO' | 'UN';
export type ElementId = 'FIRE' | 'PLANT' | 'WATER' | 'WIND' | 'EARTH' | 'LIGHTNING' | 'LIGHT' | 'DARK' | 'NULL' | 'ICE' | 'METAL';
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
  attackName?: string;
  spiritName?: string;
  spiritHitsAll?: boolean;
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
  enemyCharacterIds?: string[];
  randomEnemyCount?: number;
  enemyLevel: number;
  expReward: number;
  drops?: StageDrop[];
  bossMultipliers?: { hp?: number; def?: number };
  firstClearReward?: string;
}

export interface GameMap {
  id: string;
  name: string;
  description: string;
  requiredMapCleared?: string;
  requiredTamerLevel?: number;
  isDungeon?: boolean;
  isDaily?: boolean;
  backgroundImage?: number;
  bitsReward?: number;
  tamerExpReward?: number;
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
  METAL:     { label: 'Metal',     color: '#94a3b8', beats: 'PLANT',     weakTo: 'FIRE' },
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
    attackName: 'Garras Afiadas ○',
    spiritName: 'Chama Bebê 🔥',
  },
  agumonSaver: {
    id: 'agumonSaver',
    name: 'Agumon (Saver)',
    rarity: 'COMMON',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 135, mp: 130, atk: 94, def: 76, spt: 66, spd: 69, apt: 24 },
    description: 'Uma variante poderosa do Agumon com atributo Vacina. Lutador nato do fogo com ataque e defesa superiores à versão clássica.',
  },
  geoGreymon: {
    id: 'geoGreymon',
    name: 'GeoGreymon',
    rarity: 'RARE',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 173, mp: 175, atk: 116, def: 98, spt: 71, spd: 80, apt: 35 },
    description: 'A poderosa evolução Champion do Agumon (Saver). Um dinossauro blindado do tipo Vacina com força de fogo devastadora e resistência excepcional em batalha.',
  },
  rizeGreymon: {
    id: 'rizeGreymon',
    name: 'RizeGreymon',
    rarity: 'EPIC',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 220, mp: 247, atk: 138, def: 108, spt: 93, spd: 110, apt: 55 },
    description: 'A forma Ultimate do GeoGreymon. Um dinossauro cibernético do tipo Vacina armado com canhões de fogo. Combina poder bruto e tecnologia para devastar qualquer inimigo.',
  },
  shineGreymon: {
    id: 'shineGreymon',
    name: 'ShineGreymon',
    rarity: 'LEGENDARY',
    attribute: 'VC',
    element: 'FIRE',
    baseStats: { hp: 323, mp: 330, atk: 173, def: 140, spt: 121, spd: 127, apt: 70 },
    description: 'O ápice da linha evolutiva do Agumon (Saver). Um guerreiro solar do tipo Vacina revestido em armadura de luz solar, capaz de desencadear chamas divinas devastadoras.',
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
  guilmon: {
    id: 'guilmon',
    name: 'Guilmon',
    rarity: 'COMMON',
    attribute: 'VR',
    element: 'FIRE',
    baseStats: { hp: 120, mp: 101, atk: 87, def: 67, spt: 55, spd: 50, apt: 23 },
    description: 'Um dinossauro digital do tipo Vírus imbuído do poder do fogo. Apesar de ser Rookie, possui força de ataque que rivaliza Champions.',
    attackName: 'Garras Afiadas ○',
    spiritName: 'Respiração Pimenta 🔥',
  },
  growlmon: {
    id: 'growlmon',
    name: 'Growlmon',
    rarity: 'RARE',
    attribute: 'VR',
    element: 'FIRE',
    baseStats: { hp: 175, mp: 161, atk: 117, def: 94, spt: 78, spd: 72, apt: 40 },
    description: 'A evolução Champion do Guilmon. Um dragão do tipo Vírus que combina garras afiadas com chamas explosivas devastadoras.',
    attackName: 'Growl Claw ○',
    spiritName: 'Exhaust Flame 🔥',
  },
  megaloGrowlmon: {
    id: 'megaloGrowlmon',
    name: 'MegaloGrowlmon',
    rarity: 'EPIC',
    attribute: 'VR',
    element: 'FIRE',
    baseStats: { hp: 230, mp: 226, atk: 144, def: 124, spt: 98, spd: 92, apt: 50 },
    description: 'A forma Ultimate do Growlmon. Um dragão cibernético do tipo Vírus com armadura blindada e canhões de fogo capazes de devastar qualquer oponente.',
    attackName: 'Dramon Claw ○',
    spiritName: 'Giga Flame 🔥',
  },
  gallantmon: {
    id: 'gallantmon',
    name: 'Gallantmon',
    rarity: 'LEGENDARY',
    attribute: 'VR',
    element: 'LIGHT',
    baseStats: { hp: 326, mp: 344, atk: 182, def: 165, spt: 165, spd: 137, apt: 85 },
    description: 'O Cavaleiro Sagrado do Digital. A forma Mega do MegaloGrowlmon, um guerreiro do tipo Vírus que paradoxalmente empunha a luz divina para proteger o mundo.',
    attackName: 'EX Damage ○',
    spiritName: 'Heroic Power ✨',
  },
  gallantmonCrimsonMode: {
    id: 'gallantmonCrimsonMode',
    name: 'Gallantmon Crimson Mode',
    rarity: 'ULTRA',
    attribute: 'VR',
    element: 'LIGHT',
    baseStats: { hp: 336, mp: 370, atk: 190, def: 170, spt: 168, spd: 143, apt: 99 },
    description: 'A forma transcendente do Gallantmon fundido com o poder do Seraphimon. Seu Shining Laser purifica todos os inimigos simultaneamente com luz divina absoluta.',
    attackName: 'Mach Rush ○',
    spiritName: 'Shining Laser ✨',
    spiritHitsAll: true,
  },
  lucemon: {
    id: 'lucemon',
    name: 'Lucemon',
    rarity: 'COMMON',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 112, mp: 116, atk: 79, def: 69, spt: 78, spd: 72, apt: 30 },
    description: 'O Anjo Caído em forma de criança. Um Rookie do tipo Vacina com poder divino imenso e uma dualidade entre a luz pura e a escuridão latente que o conduzirá a transformações devastadoras.',
    attackName: 'Holy Bolt ✨',
    spiritName: 'Grand Cross ✨',
  },
  lucemonChaosMode: {
    id: 'lucemonChaosMode',
    name: 'Lucemon Chaos Mode',
    rarity: 'EPIC',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 243, mp: 265, atk: 142, def: 113, spt: 119, spd: 118, apt: 70 },
    description: 'A forma corrompida do Anjo Caído. Nascido da fusão da luz e das trevas, Lucemon Chaos Mode é um ser de poder absoluto e destruição implacável, equilibrando o divino e o demoníaco em perfeita harmonia sombria.',
    attackName: 'Divine Dasher ✨',
    spiritName: 'Chaos Blast 🌑',
  },
  magnadramon: {
    id: 'magnadramon',
    name: 'Magnadramon',
    rarity: 'LEGENDARY',
    attribute: 'VC',
    element: 'WIND',
    baseStats: { hp: 261, mp: 296, atk: 139, def: 134, spt: 149, spd: 131, apt: 66 },
    description: 'O Dragão Sagrado das Chamas Rosadas. A forma Mega da Angewomon, um poderoso dragão do tipo Vacina que incorpora o poder puro da luz e do vento. Sua presença sagrada é capaz de purificar qualquer corrupção no Mundo Digital.',
    attackName: 'Giga Scissor ⚡',
    spiritName: 'Holy Bolt ✨',
  },
  ophanimon: {
    id: 'ophanimon',
    name: 'Ophanimon',
    rarity: 'LEGENDARY',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 233, mp: 275, atk: 131, def: 124, spt: 141, spd: 125, apt: 80 },
    description: 'A Anja Celestial Suprema. A forma Mega da Angewomon, guardiã do Mundo Digital e uma das três anjas celestiais do tipo Vacina. Com poder divino absoluto, Ophanimon mantém o equilíbrio entre a luz e as trevas com perfeição inabalável.',
    attackName: 'Giga Scissor ⚡',
    spiritName: 'Holy Bolt ✨',
  },
  angewomon: {
    id: 'angewomon',
    name: 'Angewomon',
    rarity: 'EPIC',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 215, mp: 237, atk: 127, def: 99, spt: 117, spd: 114, apt: 46 },
    description: 'A Anjo Guerreira Sagrada. A forma Ultimate da Tailmon, uma bela e poderosa anja do tipo Vacina que desce dos céus com luz divina. Sua flecha celestial é capaz de purificar qualquer trevas e derrotar até as forças do mal mais obscuras.',
    attackName: 'Saint Air ✨',
    spiritName: 'Celestial Arrow ✨',
  },
  tailmon: {
    id: 'tailmon',
    name: 'Tailmon',
    rarity: 'RARE',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 138, mp: 151, atk: 95, def: 77, spt: 86, spd: 89, apt: 32 },
    description: 'O Digimon Gato Sagrado. A forma Champion da Salamon, uma guerreira ágil e misteriosa do tipo Vacina. Suas garras banhadas de luz divina são capazes de dissipar as trevas, e sua velocidade surpreende até os inimigos mais poderosos.',
    attackName: 'Sharp Claw ○',
    spiritName: 'Lightning Paw ✨',
  },
  salamon: {
    id: 'salamon',
    name: 'Salamon',
    rarity: 'COMMON',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 105, mp: 119, atk: 76, def: 59, spt: 64, spd: 61, apt: 20 },
    description: 'O Digimon Cachorrinho Sagrado. Um Rookie do tipo Vacina pacífico e gentil, dotado de luz divina. Apesar de sua aparência inofensiva, carrega dentro de si um poder celestial capaz de evoluir em poderosas guerreiras da luz.',
    attackName: 'Petit Bite ○',
    spiritName: 'Puppy Howl ✨',
  },
  phoenixmon: {
    id: 'phoenixmon',
    name: 'Phoenixmon',
    rarity: 'LEGENDARY',
    attribute: 'VC',
    element: 'WIND',
    baseStats: { hp: 325, mp: 352, atk: 171, def: 141, spt: 167, spd: 141, apt: 80 },
    description: 'A Fênix Sagrada. A forma Mega da Garudamon, considerada a encarnação da luz e do renascimento. Dotada de poder divino inigualável, esta majestosa ave lendária do tipo Vacina representa a esperança eterna e a purificação das trevas.',
    attackName: 'Fatal Cannon ✨',
    spiritName: 'Starlight Explosion ✨',
  },
  garudamon: {
    id: 'garudamon',
    name: 'Garudamon',
    rarity: 'EPIC',
    attribute: 'VC',
    element: 'WIND',
    baseStats: { hp: 215, mp: 250, atk: 128, def: 99, spt: 116, spd: 115, apt: 50 },
    description: 'O Digimon Guerreiro das Chamas. A forma Ultimate da Birdramon, uma poderosa ave de batalha do tipo Vacina revestida de armadura vermelha. Seus ataques de fogo são capazes de varrer campos inteiros de inimigos.',
    attackName: 'Crimson Claw 🔥',
    spiritName: 'Shadow Wing 🔥',
  },
  birdramon: {
    id: 'birdramon',
    name: 'Birdramon',
    rarity: 'RARE',
    attribute: 'VC',
    element: 'WIND',
    baseStats: { hp: 149, mp: 168, atk: 92, def: 75, spt: 88, spd: 90, apt: 35 },
    description: 'O Digimon Pássaro de Chamas. A forma Champion da Pyomon, uma enorme ave de fogo do tipo Vacina que domina os céus com velocidade e poder devastador. Suas asas incandescentes evaporam qualquer obstáculo.',
    attackName: 'Air Cutter 🌀',
    spiritName: 'Meteor Wing 🌀',
  },
  pyomon: {
    id: 'pyomon',
    name: 'Pyomon',
    rarity: 'COMMON',
    attribute: 'VC',
    element: 'WIND',
    baseStats: { hp: 101, mp: 114, atk: 72, def: 61, spt: 66, spd: 79, apt: 21 },
    description: 'O Digimon Pássaro de Fogo. Um Rookie do tipo Vacina ágil e corajoso, com asas flamejantes e personalidade ardente. Usa ataques de fogo e impacto para surpreender os inimigos com velocidade.',
    attackName: 'Double Flick ○',
    spiritName: 'Raging Fire 🔥',
  },
  patamon: {
    id: 'patamon',
    name: 'Patamon',
    rarity: 'COMMON',
    attribute: 'VC',
    element: 'WIND',
    baseStats: { hp: 121, mp: 114, atk: 68, def: 54, spt: 58, spd: 55, apt: 20 },
    description: 'O Digimon Asa-Orelha. Um Rookiedo tipo Vacina com personalidade gentil e corajosa. Apesar de sua aparência fofa, esconde um poder divino capaz de evoluir para poderosos anjos guerreiros.',
    attackName: 'Tackle ○',
    spiritName: 'Air Shot 🌀',
  },
  angemon: {
    id: 'angemon',
    name: 'Angemon',
    rarity: 'RARE',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 168, mp: 191, atk: 96, def: 79, spt: 89, spd: 78, apt: 37 },
    description: 'O Anjo de Seis Asas. A forma Champion do Patamon, um guerreiro celestial do tipo Vacina que usa a luz sagrada para proteger os inocentes e combater as forças das trevas.',
    attackName: 'Light Knuckle ✨',
    spiritName: 'Heart Break ✨',
  },
  magnaAngemon: {
    id: 'magnaAngemon',
    name: 'MagnaAngemon',
    rarity: 'EPIC',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 234, mp: 264, atk: 128, def: 112, spt: 123, spd: 102, apt: 57 },
    description: 'O Anjo Sagrado de armadura dourada. A forma Ultimate do Angemon, um guerreiro celestial do tipo Vacina que empunha a luz divina para combater o mal com precisão e poder inabaláveis.',
    attackName: 'Ring of Light ✨',
    spiritName: 'Shine Slash ✨',
  },
  goldramon: {
    id: 'goldramon',
    name: 'Goldramon',
    rarity: 'LEGENDARY',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 333, mp: 349, atk: 182, def: 151, spt: 168, spd: 138, apt: 80 },
    description: 'O Dragão Divino do Céu Dourado. Forma Mega do MagnaAngemon, um imponente dragão Vacina revestido de armadura dourada que comanda a luz e a terra. Sua presença irradia poder sagrado capaz de julgar qualquer ser corrompido.',
    attackName: 'God Cannon ✨',
    spiritName: 'Burst Counter 🌍',
  },
  seraphimon: {
    id: 'seraphimon',
    name: 'Seraphimon',
    rarity: 'LEGENDARY',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 308, mp: 366, atk: 178, def: 148, spt: 177, spd: 137, apt: 77 },
    description: 'O Lorde dos Anjos. A forma Mega do MagnaAngemon, guardião celestial do tipo Vacina que concentra a luz divina para purificar qualquer mal.',
    attackName: 'Starlight EX ✨',
    spiritName: '7 Heavens ✨',
  },
  devimon: {
    id: 'devimon',
    name: 'Devimon',
    rarity: 'RARE',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 166, mp: 170, atk: 108, def: 82, spt: 92, spd: 79, apt: 48 },
    description: 'O Anjo das Trevas. A forma Champion do DemiDevimon, um Digimon do tipo Vírus com poderes sombrios devastadores e asas negras imponentes.',
  },
  myotismon: {
    id: 'myotismon',
    name: 'Myotismon',
    rarity: 'EPIC',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 233, mp: 260, atk: 132, def: 121, spt: 119, spd: 95, apt: 60 },
    description: 'O Lorde das Trevas. A forma Ultimate do Devimon, um vampiro Digimon do tipo Vírus com domínio sobre a escuridão e poderes de manipulação da mente.',
  },
  vnonMyotismon: {
    id: 'vnonMyotismon',
    name: 'VenomMyotismon',
    rarity: 'LEGENDARY',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 322, mp: 345, atk: 231, def: 182, spt: 186, spd: 163, apt: 66 },
    description: 'A forma Mega corrompida do Myotismon. Consumido pelo veneno das trevas, VenomMyotismon é uma força destrutiva imparável do tipo Vírus, com poder devastador e brutalidade sem limites.',
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
  metalGarurumon: {
    id: 'metalGarurumon',
    name: 'MetalGarurumon',
    rarity: 'LEGENDARY',
    attribute: 'VC',
    element: 'ICE',
    baseStats: { hp: 312, mp: 338, atk: 167, def: 121, spt: 124, spd: 131, apt: 72 },
    description: 'A forma Mega do WereGarurumon. Um lobo metálico blindado que domina os elementos gelo e água, disparando mísseis criogênicos devastadores. Considerado um dos Digimon Vacina mais poderosos.',
  },
  omegamon: {
    id: 'omegamon',
    name: 'Omegamon',
    rarity: 'ULTRA',
    attribute: 'VC',
    element: 'LIGHT',
    baseStats: { hp: 334, mp: 358, atk: 185, def: 143, spt: 170, spd: 143, apt: 99 },
    description: 'A fusão suprema entre WarGreymon e MetalGarurumon. Um Digimon Ultra lendário do tipo Vacina, portador da espada Grey Sword e do canhão Garuru Cannon. Protege o mundo digital com poder absoluto.',
    attackName: 'Espada Cinzenta ✨',
    spiritName: 'Canhão Garuru ❄️',
  },
  gulusGammamon: {
    id: 'gulusGammamon',
    name: 'GulusGammamon',
    rarity: 'RARE',
    attribute: 'VR',
    element: 'DARK',
    baseStats: { hp: 290, mp: 260, atk: 230, def: 170, spt: 150, spd: 210, apt: 60 },
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

// ─── Fusion paths ─────────────────────────────────────────────────────────────
export interface FusionRecipe {
  partner: string;
  resultId: string;
  resultName: string;
  requiredLevel: number;
}

export const FUSIONS: Record<string, FusionRecipe> = {
  warGreymon:    { partner: 'metalGarurumon', resultId: 'omegamon',              resultName: 'Omegamon',              requiredLevel: 60 },
  metalGarurumon:{ partner: 'warGreymon',     resultId: 'omegamon',              resultName: 'Omegamon',              requiredLevel: 60 },
  gallantmon:    { partner: 'seraphimon',     resultId: 'gallantmonCrimsonMode', resultName: 'Gallantmon Crimson Mode', requiredLevel: 60 },
  angemon:       { partner: 'devimon',        resultId: 'lucemonChaosMode',      resultName: 'Lucemon Chaos Mode',      requiredLevel: 60 },
  devimon:       { partner: 'angemon',        resultId: 'lucemonChaosMode',      resultName: 'Lucemon Chaos Mode',      requiredLevel: 60 },
};

// ─── Evolution paths ──────────────────────────────────────────────────────────
export const EVOLUTIONS: Record<string, { evolvesTo: string; requiredLevel: number; label: string; requiredItem?: string }> = {
  agumon:       { evolvesTo: 'greymon',       requiredLevel: 16, label: 'Greymon' },
  agumonSaver:  { evolvesTo: 'geoGreymon',    requiredLevel: 20, label: 'GeoGreymon' },
  geoGreymon:   { evolvesTo: 'rizeGreymon',   requiredLevel: 35, label: 'RizeGreymon' },
  rizeGreymon:  { evolvesTo: 'shineGreymon',  requiredLevel: 59, label: 'ShineGreymon' },
  greymon:      { evolvesTo: 'metalGreymon',  requiredLevel: 34, label: 'MetalGreymon' },
  metalGreymon: { evolvesTo: 'warGreymon',    requiredLevel: 52, label: 'WarGreymon' },
  gabumon:      { evolvesTo: 'garurumon',     requiredLevel: 19, label: 'Garurumon' },
  garurumon:    { evolvesTo: 'wereGarurumon',   requiredLevel: 35, label: 'WereGarurumon' },
  wereGarurumon:{ evolvesTo: 'metalGarurumon', requiredLevel: 52, label: 'MetalGarurumon' },
  guilmon:      { evolvesTo: 'growlmon',      requiredLevel: 16, label: 'Growlmon' },
  growlmon:       { evolvesTo: 'megaloGrowlmon', requiredLevel: 40, label: 'MegaloGrowlmon' },
  megaloGrowlmon: { evolvesTo: 'gallantmon',   requiredLevel: 60, label: 'Gallantmon' },
  lucemon:        { evolvesTo: 'lucemonChaosMode', requiredLevel: 40, label: 'Lucemon Chaos Mode' },
  pyomon:         { evolvesTo: 'birdramon',    requiredLevel: 16, label: 'Birdramon' },
  birdramon:      { evolvesTo: 'garudamon',    requiredLevel: 32, label: 'Garudamon' },
  garudamon:      { evolvesTo: 'phoenixmon',   requiredLevel: 48, label: 'Phoenixmon' },
  salamon:        { evolvesTo: 'tailmon',      requiredLevel: 13, label: 'Tailmon' },
  tailmon:        { evolvesTo: 'angewomon',    requiredLevel: 35, label: 'Angewomon' },
  angewomon:      { evolvesTo: 'magnadramon',  requiredLevel: 60, label: 'Magnadramon' },
  patamon:        { evolvesTo: 'angemon',      requiredLevel: 19, label: 'Angemon' },
  angemon:        { evolvesTo: 'magnaAngemon', requiredLevel: 33, label: 'MagnaAngemon' },
  magnaAngemon:   { evolvesTo: 'goldramon',    requiredLevel: 60, label: 'Goldramon' },
  demiDevimon:  { evolvesTo: 'devimon',     requiredLevel: 21, label: 'Devimon' },
  devimon:      { evolvesTo: 'myotismon',     requiredLevel: 32, label: 'Myotismon' },
  myotismon:    { evolvesTo: 'vnonMyotismon', requiredLevel: 56, label: 'VenomMyotismon' },
};

// ─── Sacrifice System ────────────────────────────────────────────────────────

export const ALTERNATE_EVOLUTIONS: Record<string, { evolvesTo: string; requiredLevel: number; label: string; requiredItem?: string }> = {
  angewomon:   { evolvesTo: 'ophanimon',  requiredLevel: 60, label: 'Ophanimon',  requiredItem: 'anel_sagrado' },
  magnaAngemon: { evolvesTo: 'seraphimon', requiredLevel: 60, label: 'Seraphimon', requiredItem: 'anel_sagrado' },
};

export const SACRIFICE_DROPS: Record<string, { itemId: string; chance: number }[]> = {
  magnaAngemon:     [{ itemId: 'anel_sagrado', chance: 0.30 }],
  angewomon:        [{ itemId: 'anel_sagrado', chance: 0.30 }],
  lucemonChaosMode: [{ itemId: 'anel_sagrado', chance: 0.40 }],
  angemon:          [{ itemId: 'anel_sagrado', chance: 0.10 }],
  tailmon:          [{ itemId: 'anel_sagrado', chance: 0.10 }],
};

export const ROOKIE_OF: Record<string, string> = {
  greymon: 'agumon',        metalGreymon: 'agumon',       warGreymon: 'agumon',
  geoGreymon: 'agumonSaver', rizeGreymon: 'agumonSaver',  shineGreymon: 'agumonSaver',
  garurumon: 'gabumon',     wereGarurumon: 'gabumon',     metalGarurumon: 'gabumon',
  growlmon: 'guilmon',      megaloGrowlmon: 'guilmon',    gallantmon: 'guilmon',
  angemon: 'patamon',       magnaAngemon: 'patamon',      seraphimon: 'patamon',     goldramon: 'patamon',
  tailmon: 'salamon',       angewomon: 'salamon',         ophanimon: 'salamon',     magnadramon: 'salamon',
  devimon: 'demiDevimon',   myotismon: 'demiDevimon',     vnonMyotismon: 'demiDevimon',
};

export const SACRIFICE_SCAN_OVERRIDES: Record<string, { characterId: string; percent: number }> = {
  lucemonChaosMode: { characterId: 'lucemon', percent: 0.05 },
};

export const SACRIFICE_SCAN_PCT: Partial<Record<RarityId, number>> = {
  RARE:      0.10,
  EPIC:      0.20,
  LEGENDARY: 0.50,
};

export const ITEM_NAMES: Record<string, string> = {
  anel_sagrado: 'Anel Sagrado ✨',
};

// Characters that can be scanned (encountered as enemies in battle)
export const SCANNABLE_CHARACTERS: string[] = ['agumon', 'gabumon', 'demiDevimon', 'patamon', 'pyomon', 'salamon'];

// Display order in the Codex (grouped by evolution line)
export const CODEX_ORDER: string[] = ['agumon', 'agumonSaver', 'geoGreymon', 'rizeGreymon', 'shineGreymon', 'greymon', 'metalGreymon', 'warGreymon', 'gabumon', 'garurumon', 'wereGarurumon', 'metalGarurumon', 'omegamon', 'guilmon', 'growlmon', 'megaloGrowlmon', 'gallantmon', 'gallantmonCrimsonMode', 'lucemon', 'lucemonChaosMode', 'patamon', 'angemon', 'magnaAngemon', 'goldramon', 'seraphimon', 'pyomon', 'birdramon', 'garudamon', 'phoenixmon', 'salamon', 'tailmon', 'angewomon', 'magnadramon', 'ophanimon', 'demiDevimon', 'devimon', 'myotismon', 'vnonMyotismon', 'gulusGammamon'];

// ─── Maps & Stages ─────────────────────────────────────────────────────────────
export const GAME_MAPS: GameMap[] = [
  {
    id: 'map_forest',
    name: 'Chip Forest',
    description: 'Uma floresta de dados ancestrais onde Digimons selvagens habitam entre raízes digitais.',
    backgroundImage: require('../assets/images/maps/chip_forest.png'),
    bitsReward: 100,
    tamerExpReward: 5,
    stages: [
      { index: 0, name: 'Entrada da Floresta', enemyCharacterId: 'demiDevimon', enemyLevel: 1,  expReward: 40,  enemyCharacterIds: ['demiDevimon', 'agumon', 'pyomon', 'patamon', 'gabumon', 'salamon'], randomEnemyCount: 1 },
      { index: 1, name: 'Clareira dos Dados',  enemyCharacterId: 'gabumon',     enemyLevel: 4,  expReward: 60,  enemyCharacterIds: ['demiDevimon', 'agumon', 'pyomon', 'patamon', 'gabumon', 'salamon'], randomEnemyCount: 2 },
      { index: 2, name: 'Núcleo da Floresta',  enemyCharacterId: 'pyomon',      enemyLevel: 8,  expReward: 100, enemyCharacterIds: ['demiDevimon', 'agumon', 'pyomon', 'patamon', 'gabumon', 'salamon'], randomEnemyCount: 3 },
    ],
  },
  {
    id: 'map_city',
    name: 'Acess Glacier',
    description: 'Um glaciar digital congelado onde Digimons evoluídos patrulham as planícies de gelo.',
    backgroundImage: require('../assets/images/maps/acess_glacier.png'),
    requiredMapCleared: 'map_forest',
    bitsReward: 250,
    tamerExpReward: 10,
    stages: [
      { index: 0, name: 'Avenida dos Neons',   enemyCharacterId: 'greymon',      enemyLevel: 12,  expReward: 130, enemyCharacterIds: ['greymon', 'garurumon', 'devimon'] },
      { index: 1, name: 'Setor Industrial',    enemyCharacterId: 'garurumon',    enemyLevel: 16,  expReward: 160, enemyCharacterIds: ['greymon', 'garurumon', 'devimon'] },
      { index: 2, name: 'Torre Central',       enemyCharacterId: 'devimon',      enemyLevel: 18,  expReward: 220, enemyCharacterIds: ['greymon', 'garurumon', 'devimon'] },
    ],
  },
  {
    id: 'map_shadow',
    name: 'Chaos Brain',
    description: 'Uma dimensão corrompida onde as trevas consomem tudo. Apenas os mais fortes sobrevivem.',
    backgroundImage: require('../assets/images/maps/chaos_brain.png'),
    requiredMapCleared: 'map_city',
    bitsReward: 500,
    tamerExpReward: 15,
    stages: [
      { index: 0, name: 'Portal das Trevas',   enemyCharacterId: 'metalGreymon',  enemyLevel: 20,  expReward: 280, enemyCharacterIds: ['metalGreymon', 'wereGarurumon', 'myotismon'] },
      { index: 1, name: 'Abismo Corrompido',   enemyCharacterId: 'wereGarurumon', enemyLevel: 22,  expReward: 340, enemyCharacterIds: ['metalGreymon', 'wereGarurumon', 'myotismon'] },
      { index: 2, name: 'Trono do Caos',       enemyCharacterId: 'myotismon',     enemyLevel: 24,  expReward: 450, enemyCharacterIds: ['metalGreymon', 'wereGarurumon', 'myotismon'], firstClearReward: 'oculos_escuro_fitado' },
    ],
  },
  {
    id: 'dungeon_daily_xp',
    name: 'Treinamento Diário',
    description: 'Enfrente Lucemon Chaos Mode para ganhar EXP massiva. Reseta todo dia à meia-noite. Apenas 1x por dia.',
    isDungeon: true,
    isDaily: true,
    requiredTamerLevel: 10,
    backgroundImage: require('../assets/images/maps/dungeon_gulus.png'),
    bitsReward: 500,
    stages: [
      {
        index: 0,
        name: 'Boss — Lucemon Chaos Mode',
        enemyCharacterId: 'lucemonChaosMode',
        enemyLevel: 10,
        expReward: 1200,
        bossMultipliers: { hp: 1.5, def: 1.2 },
        drops: [
          { type: 'bits', amount: 500, chance: 1.00 },
        ],
      },
    ],
  },
  {
    id: 'dungeon_gulus',
    name: 'Covil do Gulus',
    description: 'Uma masmorra sombria onde GulusGammamon reina. Derrote-o para obter Bits e Fragmentos da Coragem.',
    isDungeon: true,
    requiredTamerLevel: 15,
    backgroundImage: require('../assets/images/maps/dungeon_gulus.png'),
    stages: [
      {
        index: 0,
        name: 'Boss — GulusGammamon',
        enemyCharacterId: 'gulusGammamon',
        enemyLevel: 25,
        expReward: 500,
        bossMultipliers: { hp: 2, def: 4 / 3 },
        firstClearReward: 'digivice_d2',
        drops: [
          { type: 'bits',  amount: 1000, chance: 1.00 },
          { type: 'piece', id: 'piece_brasao_coragem',   amount: 1, chance: 0.10 },
          { type: 'piece', id: 'piece_brasao_esperanca', amount: 1, chance: 0.10 },
          { type: 'piece', id: 'piece_brasao_amizade',   amount: 1, chance: 0.10 },
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
  elements: ElementId[];
  percent: number;
}

export interface EquipItem {
  id: string;
  name: string;
  slot: EquipSlot;
  rarity: RarityId;
  description: string;
  bonuses: Partial<BaseStats>;
  percentBonuses?: Partial<BaseStats>;
  xpSharePercent?: number;
  tamerXpBonusPercent?: number;
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
  { id: 'calca_treino',   name: 'Calça de Treino',    slot: 'calca',    rarity: 'COMMON',    description: 'Calça confortável para treinamento. Aumenta a defesa.',              bonuses: { def: 5 } },
  { id: 'sapato_tenis',   name: 'Tênis de Corrida',   slot: 'sapato',   rarity: 'COMMON',    description: 'Leve e rápido. Aumenta a velocidade do parceiro.',                  bonuses: { spd: 6 } },
  { id: 'brasao_digital',  name: 'Brasão Digital',      slot: 'brasao',   rarity: 'COMMON',    description: 'Símbolo de um Tamer legítimo. Aumenta o HP do parceiro.',                           bonuses: { hp: 15 } },
  { id: 'brasao_coragem',   name: 'Brasão da Coragem',   slot: 'brasao', rarity: 'LEGENDARY', description: 'O Brasão da Coragem de Tai. Aumenta em 20% todos os status de Digimon do tipo Fogo.',                          bonuses: {}, elementBonus: { elements: ['FIRE'],          percent: 0.20 } },
  { id: 'brasao_esperanca', name: 'Brasão da Esperança', slot: 'brasao', rarity: 'LEGENDARY', description: 'O Brasão da Esperança de TK. Aumenta em 20% todos os status de Digimon do tipo Luz.',                           bonuses: {}, elementBonus: { elements: ['LIGHT'],         percent: 0.20 } },
  { id: 'brasao_amizade',   name: 'Brasão da Amizade',   slot: 'brasao', rarity: 'LEGENDARY', description: 'O Brasão da Amizade de Matt. Aumenta em 20% todos os status de Digimon do tipo Água e Gelo.', bonuses: {}, elementBonus: { elements: ['WATER', 'ICE'], percent: 0.20 } },
  { id: 'brasao_confianca', name: 'Brasão da Confiança', slot: 'brasao', rarity: 'LEGENDARY', description: 'O Brasão da Confiança. Aumenta em 20% todos os status de Digimon do tipo Água e Metal.', bonuses: {}, elementBonus: { elements: ['WATER', 'METAL'], percent: 0.20 } },
  { id: 'brasao_pureza',    name: 'Brasão da Pureza',    slot: 'brasao', rarity: 'LEGENDARY', description: 'O Brasão da Pureza. Aumenta em 20% todos os status de Digimon do tipo Planta.',          bonuses: {}, elementBonus: { elements: ['PLANT'],          percent: 0.20 } },
  { id: 'brasao_amor',      name: 'Brasão do Amor',      slot: 'brasao', rarity: 'LEGENDARY', description: 'O Brasão do Amor. Aumenta em 15% todos os status de Digimon do tipo Fogo e Vento.',     bonuses: {}, elementBonus: { elements: ['FIRE', 'WIND'],   percent: 0.15 } },
  { id: 'brasao_luz',           name: 'Brasão da Luz',           slot: 'brasao', rarity: 'LEGENDARY', description: 'O Brasão da Luz. Aumenta em 15% todos os status de Digimon do tipo Luz e Trevas.',           bonuses: {}, elementBonus: { elements: ['LIGHT', 'DARK'],        percent: 0.15 } },
  { id: 'brasao_conhecimento',  name: 'Brasão do Conhecimento',  slot: 'brasao', rarity: 'LEGENDARY', description: 'O Brasão do Conhecimento. Aumenta em 15% todos os status de Digimon do tipo Trovão e Planta.', bonuses: {}, elementBonus: { elements: ['LIGHTNING', 'PLANT'], percent: 0.15 } },
  { id: 'digivice_d2',    name: 'Digivice D-2',       slot: 'digivice', rarity: 'EPIC',      description: 'Recompensa por derrotar GulusGammamon. Compartilha 25% do XP de batalha com Digimon reserva e aumenta 20% o XP Tamer.', bonuses: {}, xpSharePercent: 0.25, tamerXpBonusPercent: 0.20 },
  { id: 'digivice_d3',    name: 'Digivice D-3',       slot: 'digivice', rarity: 'COMMON',    description: 'Digivice padrão. Potencializa o espírito do parceiro.',             bonuses: { spt: 6 } },
  { id: 'pulseira_forca', name: 'Pulseira de Força',  slot: 'pulseira', rarity: 'COMMON',    description: 'Amplifica a força bruta do Digimon parceiro.',                      bonuses: { atk: 7 } },
  { id: 'pulseira_ouro',  name: 'Pulseira Dourada',   slot: 'pulseira', rarity: 'RARE',      description: 'Pulseira lendária que amplifica múltiplos atributos de batalha.',   bonuses: { atk: 10, spt: 8 } },
  { id: 'oculos_escuro_fitado', name: 'Óculos Escuro Fitado', slot: 'oculos', rarity: 'RARE', description: 'Recompensa do Trono do Caos. Aumenta em 1% a DEF do Digimon e +10% ao XP Tamer.', bonuses: {}, percentBonuses: { def: 0.01 }, tamerXpBonusPercent: 0.10 },
  { id: 'oculos_scanner', name: 'Óculos de Scanner',  slot: 'oculos',   rarity: 'COMMON',    description: 'Analisa inimigos em tempo real. Aumenta o MP do parceiro.',         bonuses: { mp: 8 } },
  // ── Artesanal (crafted from sewing materials) ─────────────────────────────
  // ── Costura Premium (multi-material crafts) ───────────────────────────────
  { id: 'blusa_social',      name: 'Blusa Social',       slot: 'blusa',  rarity: 'RARE', description: 'Blusa social costurada com materiais premium. Aumenta em 2% o ATK e HP do Digimon.', bonuses: {}, percentBonuses: { atk: 0.02, hp: 0.02 } },
  { id: 'bermuda_poliester', name: 'Bermuda de Poliéster', slot: 'calca', rarity: 'RARE', description: 'Bermuda leve de poliéster digital. Aumenta em 3% a DEF do Digimon.', bonuses: {}, percentBonuses: { def: 0.03 } },
  { id: 'tenis_corrida',     name: 'Tênis de Corrida',   slot: 'sapato', rarity: 'RARE', description: 'Tênis aerodinâmico de corrida. Aumenta em 3% a SPD do Digimon.',                    bonuses: {}, percentBonuses: { spd: 0.03 } },
];

export const EQUIP_SLOTS_ORDER: EquipSlot[] = ['blusa', 'calca', 'sapato', 'brasao', 'digivice', 'pulseira', 'oculos'];

export const DEFAULT_INVENTORY: string[] = [
  'blusa_tamer', 'calca_treino', 'sapato_tenis', 'brasao_digital', 'digivice_d3', 'pulseira_forca', 'oculos_scanner',
];

// ─── Crafting / Pieces ─────────────────────────────────────────────────────────
export interface PieceRequirement {
  pieceId: string;
  count: number;
  pieceName: string;
  pieceIcon: string;
  pieceColor: string;
}

export interface CraftRecipe {
  pieceId: string;
  pieceName: string;
  pieceDescription: string;
  pieceIcon: string;
  pieceColor: string;
  requiredCount: number;
  pieceRequirements?: PieceRequirement[];
  bitsCost?: number;
  resultItemId: string;
  resultItemName: string;
  resultRarity: RarityId;
}

// ─── Tamers ───────────────────────────────────────────────────────────────────
export interface TamerOption {
  id: string;
  name: string;
  fullName: string;
  description: string;
  accentColor: string;
  image: number;
  forGender: 'M' | 'F' | 'N';
  avatarOffset: number; // negative = skip top pixels (show lower face), positive = show from very top
}

export const TAMERS: TamerOption[] = [
  // Female tamers
  {
    id: 'tamer_mimi',
    name: 'Mimi',
    fullName: 'Mimi Tachikawa',
    description: 'Gentil e determinada, sua amizade com seus Digimon é inabalável.',
    accentColor: '#ec4899',
    image: require('../assets/tamers/mimi_bg.png'),
    forGender: 'F',
    avatarOffset: -8,
  },
  {
    id: 'tamer_sora',
    name: 'Sora',
    fullName: 'Sora Takenouchi',
    description: 'Corajosa e protetora, cuida dos seus companheiros em qualquer batalha.',
    accentColor: '#f97316',
    image: require('../assets/tamers/sora_bg.png'),
    forGender: 'F',
    avatarOffset: -8,
  },
  {
    id: 'tamer_kari',
    name: 'Kari',
    fullName: 'Hikari Kamiya',
    description: 'Bondosa e iluminada, sua luz guia os Digimon pelo mundo digital.',
    accentColor: '#f59e0b',
    image: require('../assets/tamers/kari_bg.png'),
    forGender: 'F',
    avatarOffset: -8,
  },
  // Male tamers
  {
    id: 'tamer_matt',
    name: 'Matt',
    fullName: 'Yamato Ishida',
    description: 'Frio e determinado, lidera com amizade e força inabalável.',
    accentColor: '#3b82f6',
    image: require('../assets/tamers/matt.png'),
    forGender: 'M',
    avatarOffset: -8,
  },
  {
    id: 'tamer_tai',
    name: 'Tai',
    fullName: 'Taichi Kamiya',
    description: 'Destemido e impulsivo, enfrenta qualquer desafio de cabeça.',
    accentColor: '#ef4444',
    image: require('../assets/tamers/tai_bg.png'),
    forGender: 'M',
    avatarOffset: -8,
  },
  {
    id: 'tamer_tk',
    name: 'TK',
    fullName: 'Takeru Takaishi',
    description: 'Esperançoso e resiliente, sua esperança nunca se apaga nas trevas.',
    accentColor: '#22c55e',
    image: require('../assets/tamers/tk.png'),
    forGender: 'M',
    avatarOffset: -38,
  },
];

export const CRAFT_RECIPES: CraftRecipe[] = [
  // ── Chip Forest drops: piece_coragem ──────────────────────────────────────
  // ── Dungeon Gulus drop: piece_brasao_coragem ─────────────────────────────
  {
    pieceId: 'piece_brasao_coragem',
    pieceName: 'Fragmento do Brasão',
    pieceDescription: 'Drop raro da masmorra do GulusGammamon. Necessário para forjar o lendário Brasão da Coragem.',
    pieceIcon: 'sun',
    pieceColor: '#f97316',
    requiredCount: 50,
    bitsCost: 50000,
    resultItemId: 'brasao_coragem',
    resultItemName: 'Brasão da Coragem',
    resultRarity: 'LEGENDARY',
  },
  {
    pieceId: 'piece_brasao_esperanca',
    pieceName: 'Fragmento da Esperança',
    pieceDescription: 'Drop raro da masmorra do GulusGammamon. Necessário para forjar o lendário Brasão da Esperança.',
    pieceIcon: 'sun',
    pieceColor: '#eab308',
    requiredCount: 50,
    bitsCost: 50000,
    resultItemId: 'brasao_esperanca',
    resultItemName: 'Brasão da Esperança',
    resultRarity: 'LEGENDARY',
  },
  {
    pieceId: 'piece_brasao_amizade',
    pieceName: 'Fragmento da Amizade',
    pieceDescription: 'Drop raro da masmorra do GulusGammamon. Necessário para forjar o lendário Brasão da Amizade.',
    pieceIcon: 'users',
    pieceColor: '#3b82f6',
    requiredCount: 50,
    bitsCost: 50000,
    resultItemId: 'brasao_amizade',
    resultItemName: 'Brasão da Amizade',
    resultRarity: 'LEGENDARY',
  },
  {
    pieceId: 'piece_brasao_confianca',
    pieceName: 'Fragmento da Confiança',
    pieceDescription: 'Fragmento raro necessário para forjar o lendário Brasão da Confiança.',
    pieceIcon: 'shield',
    pieceColor: '#94a3b8',
    requiredCount: 50,
    bitsCost: 50000,
    resultItemId: 'brasao_confianca',
    resultItemName: 'Brasão da Confiança',
    resultRarity: 'LEGENDARY',
  },
  {
    pieceId: 'piece_brasao_pureza',
    pieceName: 'Fragmento da Pureza',
    pieceDescription: 'Fragmento raro necessário para forjar o lendário Brasão da Pureza.',
    pieceIcon: 'droplet',
    pieceColor: '#22c55e',
    requiredCount: 50,
    bitsCost: 50000,
    resultItemId: 'brasao_pureza',
    resultItemName: 'Brasão da Pureza',
    resultRarity: 'LEGENDARY',
  },
  {
    pieceId: 'piece_brasao_conhecimento',
    pieceName: 'Fragmento do Conhecimento',
    pieceDescription: 'Fragmento raro necessário para forjar o lendário Brasão do Conhecimento.',
    pieceIcon: 'book',
    pieceColor: '#a855f7',
    requiredCount: 50,
    bitsCost: 50000,
    resultItemId: 'brasao_conhecimento',
    resultItemName: 'Brasão do Conhecimento',
    resultRarity: 'LEGENDARY',
  },
  {
    pieceId: 'piece_brasao_luz',
    pieceName: 'Fragmento da Luz',
    pieceDescription: 'Fragmento raro necessário para forjar o lendário Brasão da Luz.',
    pieceIcon: 'star',
    pieceColor: '#c084fc',
    requiredCount: 50,
    bitsCost: 50000,
    resultItemId: 'brasao_luz',
    resultItemName: 'Brasão da Luz',
    resultRarity: 'LEGENDARY',
  },
  {
    pieceId: 'piece_brasao_amor',
    pieceName: 'Fragmento do Amor',
    pieceDescription: 'Fragmento raro necessário para forjar o lendário Brasão do Amor.',
    pieceIcon: 'heart',
    pieceColor: '#f43f5e',
    requiredCount: 50,
    bitsCost: 50000,
    resultItemId: 'brasao_amor',
    resultItemName: 'Brasão do Amor',
    resultRarity: 'LEGENDARY',
  },
  // ── Acess Glacier drops: piece_gelo ──────────────────────────────────────
  // ── Costura Premium: multi-material recipes ──────────────────────────────
  {
    pieceId: 'piece_tecido',
    pieceName: 'Tecido Colorido',
    pieceDescription: 'Receita premium de múltiplos materiais. Forja a Blusa Social com bônus percentuais.',
    pieceIcon: 'layers',
    pieceColor: '#ec4899',
    requiredCount: 20,
    pieceRequirements: [
      { pieceId: 'piece_tecido', count: 20, pieceName: 'Tecido Colorido', pieceIcon: 'layers', pieceColor: '#ec4899' },
      { pieceId: 'piece_linha',  count: 30, pieceName: 'Linha Colorida',  pieceIcon: 'wind',   pieceColor: '#06b6d4' },
      { pieceId: 'piece_agulha', count: 20, pieceName: 'Agulha Média',    pieceIcon: 'edit-2', pieceColor: '#8b5cf6' },
    ],
    bitsCost: 10000,
    resultItemId: 'blusa_social',
    resultItemName: 'Blusa Social',
    resultRarity: 'RARE',
  },
  {
    pieceId: 'piece_tecido',
    pieceName: 'Tecido Colorido',
    pieceDescription: 'Receita premium de múltiplos materiais. Forja a Bermuda de Poliéster com bônus percentuais.',
    pieceIcon: 'layers',
    pieceColor: '#ec4899',
    requiredCount: 20,
    pieceRequirements: [
      { pieceId: 'piece_tecido', count: 20, pieceName: 'Tecido Colorido', pieceIcon: 'layers', pieceColor: '#ec4899' },
      { pieceId: 'piece_linha',  count: 30, pieceName: 'Linha Colorida',  pieceIcon: 'wind',   pieceColor: '#06b6d4' },
      { pieceId: 'piece_agulha', count: 20, pieceName: 'Agulha Média',    pieceIcon: 'edit-2', pieceColor: '#8b5cf6' },
    ],
    bitsCost: 10000,
    resultItemId: 'bermuda_poliester',
    resultItemName: 'Bermuda de Poliéster',
    resultRarity: 'RARE',
  },
  {
    pieceId: 'piece_tecido',
    pieceName: 'Tecido Colorido',
    pieceDescription: 'Receita premium de múltiplos materiais. Forja o Tênis de Corrida com bônus percentuais.',
    pieceIcon: 'layers',
    pieceColor: '#ec4899',
    requiredCount: 20,
    pieceRequirements: [
      { pieceId: 'piece_tecido', count: 20, pieceName: 'Tecido Colorido', pieceIcon: 'layers', pieceColor: '#ec4899' },
      { pieceId: 'piece_linha',  count: 30, pieceName: 'Linha Colorida',  pieceIcon: 'wind',   pieceColor: '#06b6d4' },
      { pieceId: 'piece_agulha', count: 20, pieceName: 'Agulha Média',    pieceIcon: 'edit-2', pieceColor: '#8b5cf6' },
    ],
    bitsCost: 10000,
    resultItemId: 'tenis_corrida',
    resultItemName: 'Tênis de Corrida',
    resultRarity: 'RARE',
  },
  // ── Chaos Brain drops: piece_caos ────────────────────────────────────────
  {
    pieceId: 'piece_caos',
    pieceName: 'Fragmento do Caos',
    pieceDescription: 'Drop do Chaos Brain. Usado para forjar itens épicos.',
    pieceIcon: 'cpu',
    pieceColor: '#a855f7',
    requiredCount: 5,
    bitsCost: 500,
    resultItemId: 'pulseira_ouro',
    resultItemName: 'Pulseira Dourada',
    resultRarity: 'RARE',
  },
];

export function expToNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.15, level - 1));
}

export function tamerExpToNextLevel(level: number): number {
  return 20 * Math.pow(2, level - 1);
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
