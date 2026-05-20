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

  let log = `${attacker.name} usou ${action === 'SPIRIT' ? 'Espírito' : 'Ataque'}! `;
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

export function buildFighter(
  name: string,
  attribute: AttributeId,
  element: ElementId,
  baseStats: BaseStats,
  level: number,
): BattleFighter {
  const stats = getScaledStats(baseStats, level);
  return { name, attribute, element, stats, currentHP: stats.hp, currentMP: stats.mp };
}

export function enemyChooseAction(enemy: BattleFighter): ActionType {
  if (enemy.currentMP >= SPIRIT_MP_COST && Math.random() < 0.35) return 'SPIRIT';
  return 'ATTACK';
}
