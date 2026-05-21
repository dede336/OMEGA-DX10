import { AttributeId, ElementId, ATTRIBUTES, ELEMENTS, BaseStats, getScaledStats } from '@/constants/gameData';

export const ADVANTAGE_MULT = 1.5;
export const DISADVANTAGE_MULT = 0.75;
export const NEUTRAL_MULT = 1.0;
export const SPIRIT_MP_COST = 30;

export function getAttributeMultiplier(attackerAttr: AttributeId, defenderAttr: AttributeId): number {
  const attrData = ATTRIBUTES[attackerAttr];
  if (attrData.beats === defenderAttr) return ADVANTAGE_MULT;
  const defAttrData = ATTRIBUTES[defenderAttr];
  if (defAttrData.beats === attackerAttr) return DISADVANTAGE_MULT;
  return NEUTRAL_MULT;
}

export function getElementMultiplier(attackerElem: ElementId, defenderElem: ElementId): number {
  if (attackerElem === 'NULL' || defenderElem === 'NULL') return NEUTRAL_MULT;
  const elemData = ELEMENTS[attackerElem];
  if (elemData.beats === defenderElem) return ADVANTAGE_MULT;
  const defElemData = ELEMENTS[defenderElem];
  if (defElemData.beats === attackerElem) return DISADVANTAGE_MULT;
  return NEUTRAL_MULT;
}

export interface BattleFighter {
  name: string;
  attribute: AttributeId;
  element: ElementId;
  stats: BaseStats;
  currentHP: number;
  currentMP: number;
  attackName?: string;
  spiritName?: string;
}

export type ActionType = 'ATTACK' | 'SPIRIT';

export interface BattleResult {
  damage: number;
  newHP: number;
  newMP: number;
  attrMult: number;
  elemMult: number;
  isCrit: boolean;
  log: string;
}

export function executeTurn(
  attacker: BattleFighter,
  defender: BattleFighter,
  action: ActionType,
): { attackerResult: { newMP: number }; defenderResult: BattleResult } {
  const attrMult = getAttributeMultiplier(attacker.attribute, defender.attribute);
  const elemMult = getElementMultiplier(attacker.element, defender.element);

  const critChance = attacker.stats.apt / 200;
  const isCrit = Math.random() < critChance;
  const critMult = isCrit ? 1.5 : 1.0;

  let newAttackerMP = attacker.currentMP;

  let rawDamage: number;
  if (action === 'SPIRIT') {
    rawDamage = Math.max(1, (attacker.stats.spt * 1.4 - defender.stats.def * 0.5) * attrMult * elemMult * critMult);
    newAttackerMP = Math.max(0, attacker.currentMP - SPIRIT_MP_COST);
  } else {
    rawDamage = Math.max(1, (attacker.stats.atk - defender.stats.def * 0.8) * attrMult * elemMult * critMult);
  }

  const damage = Math.floor(rawDamage);
  const newHP = Math.max(0, defender.currentHP - damage);

  const moveName = action === 'SPIRIT'
    ? (attacker.spiritName ?? 'Espírito')
    : (attacker.attackName ?? 'Ataque');
  let log = `${attacker.name} usou ${moveName}! `;
  if (attrMult > 1) log += '(Atributo Eficaz!) ';
  if (attrMult < 1) log += '(Atributo Ineficaz) ';
  if (elemMult > 1) log += '(Elemento Eficaz!) ';
  if (elemMult < 1) log += '(Elemento Ineficaz) ';
  if (isCrit) log += '(CRÍTICO!) ';
  log += `${defender.name} recebeu ${damage} de dano.`;

  return {
    attackerResult: { newMP: newAttackerMP },
    defenderResult: { damage, newHP, newMP: defender.currentMP, attrMult, elemMult, isCrit, log },
  };
}

export function whoGoesFirst(player: BattleFighter, enemy: BattleFighter): 'player' | 'enemy' {
  if (player.stats.spd > enemy.stats.spd) return 'player';
  if (enemy.stats.spd > player.stats.spd) return 'enemy';
  return Math.random() < 0.5 ? 'player' : 'enemy';
}

export interface EquipBonuses {
  flat: Partial<BaseStats>;
  elementBonuses?: { elements: ElementId[]; percent: number }[];
  percentBonuses?: Partial<BaseStats>;
}

export function buildFighter(
  name: string,
  attribute: AttributeId,
  element: ElementId,
  baseStats: BaseStats,
  level: number,
  equipBonuses?: EquipBonuses,
  moveNames?: { attackName?: string; spiritName?: string },
): BattleFighter {
  let stats = getScaledStats(baseStats, level);

  if (equipBonuses) {
    const { flat, elementBonuses } = equipBonuses;

    stats = {
      hp:  stats.hp  + (flat.hp  ?? 0),
      mp:  stats.mp  + (flat.mp  ?? 0),
      atk: stats.atk + (flat.atk ?? 0),
      def: stats.def + (flat.def ?? 0),
      spt: stats.spt + (flat.spt ?? 0),
      spd: stats.spd + (flat.spd ?? 0),
      apt: stats.apt + (flat.apt ?? 0),
    };

    if (elementBonuses) {
      for (const eb of elementBonuses) {
        if (eb.elements.includes(element)) {
          const m = 1 + eb.percent;
          stats = {
            hp:  Math.floor(stats.hp  * m),
            mp:  Math.floor(stats.mp  * m),
            atk: Math.floor(stats.atk * m),
            def: Math.floor(stats.def * m),
            spt: Math.floor(stats.spt * m),
            spd: Math.floor(stats.spd * m),
            apt: Math.floor(stats.apt * m),
          };
        }
      }
    }

    const { percentBonuses } = equipBonuses;
    if (percentBonuses) {
      stats = {
        hp:  percentBonuses.hp  ? Math.floor(stats.hp  * (1 + percentBonuses.hp))  : stats.hp,
        mp:  percentBonuses.mp  ? Math.floor(stats.mp  * (1 + percentBonuses.mp))  : stats.mp,
        atk: percentBonuses.atk ? Math.floor(stats.atk * (1 + percentBonuses.atk)) : stats.atk,
        def: percentBonuses.def ? Math.floor(stats.def * (1 + percentBonuses.def)) : stats.def,
        spt: percentBonuses.spt ? Math.floor(stats.spt * (1 + percentBonuses.spt)) : stats.spt,
        spd: percentBonuses.spd ? Math.floor(stats.spd * (1 + percentBonuses.spd)) : stats.spd,
        apt: percentBonuses.apt ? Math.floor(stats.apt * (1 + percentBonuses.apt)) : stats.apt,
      };
    }
  }

  return {
    name, attribute, element, stats, currentHP: stats.hp, currentMP: stats.mp,
    attackName: moveNames?.attackName,
    spiritName: moveNames?.spiritName,
  };
}

export function enemyChooseAction(enemy: BattleFighter): ActionType {
  if (enemy.currentMP >= SPIRIT_MP_COST && Math.random() < 0.35) return 'SPIRIT';
  return 'ATTACK';
}
