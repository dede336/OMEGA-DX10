import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  ImageBackground,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import {
  CHARACTERS,
  ATTRIBUTES,
  ELEMENTS,
  GAME_MAPS,
  EQUIPMENT_ITEMS,
  EQUIP_SLOTS_ORDER,
  getScaledStats,
  ElementId,
} from '@/constants/gameData';
import CHARACTER_IMAGES from '@/constants/characterImages';
import ELEMENT_IMAGES from '@/constants/elementImages';

import {
  buildFighter,
  enemyChooseAction,
  executeTurn,
  whoGoesFirst,
  BattleFighter,
  ActionType,
  EquipBonuses,
  SPIRIT_MP_COST,
} from '@/utils/battleEngine';
import { HPBar, AttributeBadge, CharacterAvatar } from '@/components/GameComponents';

const AUTO_BATTLE_IMG = require('../assets/images/auto_battle.png');

function HitEffect({ color }: { color: string }) {
  const scale   = useRef(new Animated.Value(0.2)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale,   { toValue: 2.4, duration: 550, useNativeDriver: false }),
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,   duration: 80,  useNativeDriver: false }),
        Animated.timing(opacity, { toValue: 0,   duration: 470, useNativeDriver: false }),
      ]),
    ]).start();
  }, []);
  const inner = color + '55';
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center', zIndex: 30 }]}>
      <Animated.View style={{ width: 68, height: 68, borderRadius: 34, borderWidth: 4, borderColor: color, backgroundColor: inner, opacity, transform: [{ scale }] }} />
    </Animated.View>
  );
}

type Phase = 'select' | 'battle' | 'result';
type BattleLog = { text: string; color: string };
type TeamFighter = BattleFighter & { ownedId: string };

export default function BattleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mapId: string; stageIndex: string }>();
  const {
    collection,
    selectedCharacter,
    setSelectedCharacter,
    gainExp,
    clearStage,
    isStageCleared,
    gainScan,
    equippedItems,
    gainPiece,
    gainBits,
    gainTamerExp,
    addToInventory,
    team,
    setTeam,
    claimDailyDungeon,
  } = useGame();

  const mapId = params.mapId ?? '';
  const stageIndex = Number(params.stageIndex ?? '0');
  const map = GAME_MAPS.find((m) => m.id === mapId);
  const stage = map?.stages[stageIndex];
  const alreadyCleared = isStageCleared(mapId, stageIndex);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  // ── Phase / result ─────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('select');
  const [winner, setWinner] = useState<'player' | 'enemy' | null>(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<BattleLog[]>([]);
  const logRef = useRef<ScrollView>(null);

  // ── Team selection ─────────────────────────────────────────────────────────
  const initialTeam = team.length > 0 ? team : (selectedCharacter ? [selectedCharacter.ownedId] : []);
  const [selectedTeam, setSelectedTeam] = useState<string[]>(initialTeam);
  const selectedTeamRef = useRef<string[]>(initialTeam);
  useEffect(() => { selectedTeamRef.current = selectedTeam; }, [selectedTeam]);

  // ── Player team ────────────────────────────────────────────────────────────
  const [teamFighters, setTeamFighters] = useState<TeamFighter[]>([]);
  const [activeTeamIdx, setActiveTeamIdx] = useState(0);
  const teamFightersRef = useRef<TeamFighter[]>([]);
  const activeTeamIdxRef = useRef(0);
  useEffect(() => { teamFightersRef.current = teamFighters; }, [teamFighters]);
  useEffect(() => { activeTeamIdxRef.current = activeTeamIdx; }, [activeTeamIdx]);

  // ── Simultaneous enemies ───────────────────────────────────────────────────
  const [enemies, setEnemies] = useState<BattleFighter[]>([]);
  const [battleCharIds, setBattleCharIds] = useState<string[]>([]);
  const [targetIdx, setTargetIdx] = useState(0);
  const enemiesRef = useRef<BattleFighter[]>([]);
  const targetIdxRef = useRef(0);
  useEffect(() => { enemiesRef.current = enemies; }, [enemies]);
  useEffect(() => { targetIdxRef.current = targetIdx; }, [targetIdx]);

  // ── Active player fighter (derived) ───────────────────────────────────────
  const playerFighter = teamFighters[activeTeamIdx] ?? null;

  // ── Auto battle ────────────────────────────────────────────────────────────
  const [autoMode, setAutoMode] = useState(false);
  const [autoRunCount, setAutoRunCount] = useState(0);
  const autoModeRef = useRef(false);
  const autoRunCountRef = useRef(0);
  const AUTO_RUN_MAX = 10;
  useEffect(() => { autoModeRef.current = autoMode; }, [autoMode]);
  useEffect(() => { autoRunCountRef.current = autoRunCount; }, [autoRunCount]);

  // ── Animations ─────────────────────────────────────────────────────────────
  const playerShake = useRef(new Animated.Value(0)).current;
  const enemyShakes = useRef<Animated.Value[]>([]).current;
  function getEnemyShake(idx: number): Animated.Value {
    while (enemyShakes.length <= idx) enemyShakes.push(new Animated.Value(0));
    return enemyShakes[idx];
  }
  const shake = useCallback((anim: Animated.Value) => {
    Animated.sequence([
      Animated.timing(anim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Element hit flash ───────────────────────────────────────────────────────
  const [hitFlash, setHitFlash] = useState<{ element: ElementId; idx: number; key: number } | null>(null);
  const flashElementHit = useCallback((element: ElementId, idx: number) => {
    setHitFlash({ element, idx, key: Date.now() });
    setTimeout(() => setHitFlash(null), 600);
  }, []);

  const [playerHitFlash, setPlayerHitFlash] = useState<{ element: ElementId; key: number } | null>(null);
  const flashPlayerHit = useCallback((element: ElementId) => {
    setPlayerHitFlash({ element, key: Date.now() });
    setTimeout(() => setPlayerHitFlash(null), 600);
  }, []);

  // ── Auto-battle tick ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!autoMode || busy || phase !== 'battle' || winner !== null) return;
    const timer = setTimeout(() => { if (autoModeRef.current) handleAction('ATTACK'); }, 700);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMode, busy, phase, winner]);

  // ── Auto-restart after win ─────────────────────────────────────────────────
  useEffect(() => {
    if (!autoMode || winner !== 'player') return;
    if (autoRunCountRef.current >= AUTO_RUN_MAX) { setAutoMode(false); return; }
    const timer = setTimeout(() => {
      if (!autoModeRef.current) return;
      setAutoRunCount((p) => p + 1);
      router.replace(`/battle?mapId=${mapId}&stageIndex=${stageIndex}`);
    }, 3000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMode, winner]);

  function addLog(text: string, color: string = colors.foreground) {
    setLog((prev) => [...prev, { text, color }]);
    setTimeout(() => logRef.current?.scrollToEnd({ animated: true }), 100);
  }

  // ── Build equip bonuses ────────────────────────────────────────────────────
  function buildEquipBonuses(): EquipBonuses {
    const bonuses: EquipBonuses = { flat: {} };
    EQUIP_SLOTS_ORDER.forEach((slot) => {
      const itemId = equippedItems[slot];
      if (!itemId) return;
      const item = EQUIPMENT_ITEMS.find((i) => i.id === itemId);
      if (!item) return;
      Object.entries(item.bonuses).forEach(([k, v]) => {
        (bonuses.flat as Record<string, number>)[k] = ((bonuses.flat as Record<string, number>)[k] ?? 0) + (v ?? 0);
      });
      if (item.elementBonus) {
        if (!bonuses.elementBonuses) bonuses.elementBonuses = [];
        bonuses.elementBonuses.push(item.elementBonus);
      }
      if (item.percentBonuses) {
        if (!bonuses.percentBonuses) bonuses.percentBonuses = {};
        Object.entries(item.percentBonuses).forEach(([k, v]) => {
          if (v !== undefined) {
            (bonuses.percentBonuses as Record<string, number>)[k] =
              ((bonuses.percentBonuses as Record<string, number>)[k] ?? 0) + v;
          }
        });
      }
    });
    return bonuses;
  }

  // ── Build single enemy ─────────────────────────────────────────────────────
  function buildEnemy(charId: string): BattleFighter {
    const eChar = CHARACTERS[charId];
    let f = buildFighter(
      eChar.name, eChar.attribute, eChar.element, eChar.baseStats, stage!.enemyLevel,
      undefined, { attackName: eChar.attackName, spiritName: eChar.spiritName },
    );
    if (stage!.bossMultipliers) {
      const bm = stage!.bossMultipliers;
      const hp = bm.hp ? Math.floor(f.stats.hp * bm.hp) : f.stats.hp;
      const def = bm.def ? Math.floor(f.stats.def * bm.def) : f.stats.def;
      f = { ...f, currentHP: hp, stats: { ...f.stats, hp, def } };
    }
    return f;
  }

  // ── Grant rewards ──────────────────────────────────────────────────────────
  function grantRewards(activeOwnedId: string) {
    const enemyCount = (stage?.enemyCharacterIds ?? [stage?.enemyCharacterId]).filter(Boolean).length;
    const xp = (stage?.expReward ?? 0) * enemyCount;
    gainExp(activeOwnedId, xp);
    if (enemyCount > 1) addLog(`⚔️ Bônus de ${enemyCount}x inimigos: +${xp} EXP!`, '#22c55e');

    const bench = teamFightersRef.current.filter((t) => t.ownedId !== activeOwnedId && t.currentHP > 0);

    // Base bench XP: 50% always
    if (bench.length > 0 && xp > 0) {
      const baseShared = Math.floor(xp * 0.5);
      if (baseShared > 0) {
        bench.forEach((t) => gainExp(t.ownedId, baseShared));
        addLog(`👥 +${baseShared} EXP para o time!`, '#22c55e');
      }
    }

    // Digivice extra bonus
    const dv = equippedItems.digivice
      ? EQUIPMENT_ITEMS.find((i) => i.id === equippedItems.digivice)
      : null;
    if (dv?.xpSharePercent && xp > 0 && bench.length > 0) {
      const dvShared = Math.floor(xp * dv.xpSharePercent);
      if (dvShared > 0) {
        bench.forEach((t) => gainExp(t.ownedId, dvShared));
        addLog(`📡 +${dvShared} XP bônus (Digivice)!`, '#60a5fa');
      }
    }

    const wasCleared = isStageCleared(mapId, stageIndex);
    if (map?.isDaily) {
      claimDailyDungeon();
      addLog('📅 Treinamento diário concluído! Volta amanhã às 00:00.', '#f59e0b');
    } else {
      clearStage(mapId, stageIndex);
    }
    if (!wasCleared && stage?.firstClearReward) {
      addToInventory(stage.firstClearReward);
      const ri = EQUIPMENT_ITEMS.find((i) => i.id === stage!.firstClearReward);
      addLog(`🎁 ${ri?.name ?? stage.firstClearReward} obtido!`, '#f59e0b');
    }

    const charIds = stage?.enemyCharacterIds ?? [stage?.enemyCharacterId ?? ''];
    charIds.forEach((eid) => { if (CHARACTERS[eid]?.rarity === 'COMMON') gainScan(eid, 5); });

    if (map?.bitsReward) {
      gainBits(map.bitsReward);
      addLog(`💰 +${map.bitsReward.toLocaleString()} Bits!`, '#facc15');
    }
    if (map?.tamerExpReward) {
      const tx = dv?.tamerXpBonusPercent
        ? Math.floor(map.tamerExpReward * (1 + dv.tamerXpBonusPercent))
        : map.tamerExpReward;
      gainTamerExp(tx);
      addLog(`⭐ +${tx} XP Tamer!`, '#a78bfa');
    }

    if (stage?.drops) {
      stage.drops.forEach((d) => {
        if (Math.random() < d.chance) {
          if (d.type === 'bits') { gainBits(d.amount); addLog(`💰 +${d.amount.toLocaleString()} Bits!`, '#facc15'); }
          else if (d.type === 'piece' && d.id) { gainPiece(d.id, d.amount); addLog('✦ Fragmento obtido!', '#f59e0b'); }
        }
      });
    } else if (Math.random() < 0.30) {
      if (mapId === 'map_forest') { gainPiece('piece_coragem', 1); addLog('🔴 Fragmento da Coragem!', '#ef4444'); }
      else if (mapId === 'map_city') { gainPiece('piece_gelo', 1); addLog('🔵 Fragmento de Gelo!', '#38bdf8'); }
      else if (mapId === 'map_shadow') { gainPiece('piece_caos', 1); addLog('🟣 Fragmento do Caos!', '#a855f7'); }
    }
    if (Math.random() < 0.20) { gainPiece('piece_tecido', 1); addLog('🎨 Tecido Colorido!', '#ec4899'); }
    if (Math.random() < 0.20) { gainPiece('piece_agulha', 1); addLog('🪡 Agulha Média!', '#8b5cf6'); }
    if (Math.random() < 0.20) { gainPiece('piece_linha', 1); addLog('🧵 Linha Colorida!', '#06b6d4'); }
  }

  // ── Start battle ───────────────────────────────────────────────────────────
  function startBattle(teamIds: string[]) {
    if (!stage || teamIds.length === 0) return;
    const eqBonuses = buildEquipBonuses();

    const fighters: TeamFighter[] = [];
    for (const ownedId of teamIds) {
      const owned = collection.find((c) => c.ownedId === ownedId);
      if (!owned) continue;
      const ch = CHARACTERS[owned.characterId];
      if (!ch) continue;
      fighters.push({
        ...buildFighter(ch.name, ch.attribute, ch.element, ch.baseStats, owned.level, eqBonuses,
          { attackName: ch.attackName, spiritName: ch.spiritName }),
        ownedId,
        spiritHitsAll: ch.spiritHitsAll,
      });
    }
    if (fighters.length === 0) return;

    // Build enemies — random subset if randomEnemyCount is set
    const pool = stage.enemyCharacterIds ?? [stage.enemyCharacterId];
    let charIds: string[];
    if (stage.randomEnemyCount && stage.randomEnemyCount < pool.length) {
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      charIds = shuffled.slice(0, stage.randomEnemyCount);
    } else {
      charIds = pool;
    }
    const allEnemies = charIds.map((id) => buildEnemy(id));

    teamFightersRef.current = fighters;
    activeTeamIdxRef.current = 0;
    enemiesRef.current = allEnemies;
    targetIdxRef.current = 0;

    setTeamFighters(fighters);
    setActiveTeamIdx(0);
    setEnemies(allEnemies);
    setBattleCharIds(charIds);
    setTargetIdx(0);
    setSelectedCharacter(fighters[0].ownedId);
    setTeam(teamIds);
    setLog([]);
    setWinner(null);
    setBusy(false);
    setPhase('battle');

    const firstEnemy = allEnemies[0];
    const first = whoGoesFirst(fighters[0], firstEnemy);
    addLog(
      first === 'player'
        ? `${fighters[0].name} age primeiro!`
        : `${firstEnemy.name} age primeiro!`,
      colors.primary,
    );
    if (first === 'enemy') setTimeout(() => doEnemiesCounterAttack(fighters[0], allEnemies), 800);
  }

  // ── All living enemies counter-attack ──────────────────────────────────────
  // Returns true if the player team is wiped out
  function doEnemiesCounterAttack(
    pF: BattleFighter,
    currentEnemies: BattleFighter[],
    delay = 0,
  ): boolean {
    const living = currentEnemies.filter((e) => e.currentHP > 0);
    if (living.length === 0) return false;

    let currentPlayerHP = pF.currentHP;
    let currentPlayerMP = pF.currentMP;
    let playerDead = false;

    living.forEach((enemy, i) => {
      setTimeout(() => {
        if (playerDead) return;
        const latestTeam = teamFightersRef.current;
        const latestPF = latestTeam[activeTeamIdxRef.current];
        if (!latestPF || latestPF.currentHP <= 0) return;

        const action = enemyChooseAction(enemy);
        const result = executeTurn(enemy, { ...latestPF, currentHP: currentPlayerHP, currentMP: currentPlayerMP }, action);
        const lc = result.defenderResult.attrMult > 1 || result.defenderResult.elemMult > 1
          ? '#ef4444' : colors.foreground;
        addLog(result.defenderResult.log, lc);
        shake(playerShake);
        flashPlayerHit(enemy.element);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        currentPlayerHP = result.defenderResult.newHP;
        currentPlayerMP = latestPF.currentMP;

        // Update enemy MP
        const updatedEnemies = enemiesRef.current.map((e) =>
          e.name === enemy.name && e.currentHP > 0
            ? { ...e, currentMP: result.attackerResult.newMP }
            : e
        );
        setEnemies(updatedEnemies);
        enemiesRef.current = updatedEnemies;

        // Update player HP
        const updatedTeam = teamFightersRef.current.map((t, idx) =>
          idx === activeTeamIdxRef.current ? { ...t, currentHP: currentPlayerHP } : t
        );
        setTeamFighters(updatedTeam);
        teamFightersRef.current = updatedTeam;

        if (currentPlayerHP <= 0) {
          playerDead = true;
          setTimeout(() => {
            addLog(`${latestPF.name} foi derrotado!`, '#ef4444');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            const nextIdx = activeTeamIdxRef.current + 1;
            if (nextIdx < teamFightersRef.current.length) {
              const next = teamFightersRef.current[nextIdx];
              addLog(`${next.name} entrou em batalha!`, '#f59e0b');
              activeTeamIdxRef.current = nextIdx;
              setActiveTeamIdx(nextIdx);
              setSelectedCharacter(next.ownedId);
              setBusy(false);
            } else {
              addLog('Toda a equipe foi derrotada!', '#ef4444');
              setWinner('enemy');
              setPhase('result');
            }
          }, 400);
        } else if (i === living.length - 1) {
          // Last enemy counter-attack done
          setBusy(false);
        }
      }, delay + i * 450);
    });

    return false;
  }

  // ── Bench fighters attack sequentially, then enemies counter ───────────────
  function doBenchThenCounter(bench: BattleFighter[], idx: number) {
    const allEnemiesDead = enemiesRef.current.every((e) => e.currentHP <= 0);
    if (allEnemiesDead) return;

    if (idx >= bench.length) {
      // All bench done → enemies counter-attack
      setTimeout(() => {
        const pf = teamFightersRef.current[activeTeamIdxRef.current];
        if (!pf || pf.currentHP <= 0) { setBusy(false); return; }
        doEnemiesCounterAttack(pf, enemiesRef.current);
      }, 400);
      return;
    }

    setTimeout(() => {
      if (enemiesRef.current.every((e) => e.currentHP <= 0)) return;

      const attacker = bench[idx];
      if (attacker.currentHP <= 0) { doBenchThenCounter(bench, idx + 1); return; }

      // Find living target
      let tIdx = targetIdxRef.current;
      if ((enemiesRef.current[tIdx]?.currentHP ?? 0) <= 0) {
        tIdx = enemiesRef.current.findIndex((e) => e.currentHP > 0);
        if (tIdx < 0) return;
        targetIdxRef.current = tIdx;
        setTargetIdx(tIdx);
      }

      const tgt = enemiesRef.current[tIdx];
      if (!tgt || tgt.currentHP <= 0) { doBenchThenCounter(bench, idx + 1); return; }

      const result = executeTurn(attacker, tgt, 'ATTACK');
      const newHP = result.defenderResult.newHP;
      const lc = result.defenderResult.attrMult > 1 || result.defenderResult.elemMult > 1
        ? '#22c55e' : colors.foreground;
      addLog(result.defenderResult.log, lc);
      shake(getEnemyShake(tIdx));
      flashElementHit(attacker.element, tIdx);

      const newEnemies = enemiesRef.current.map((e, i) =>
        i === tIdx ? { ...e, currentHP: newHP } : e
      );
      setEnemies(newEnemies);
      enemiesRef.current = newEnemies;

      if (newHP <= 0) {
        addLog(`${tgt.name} foi derrotado!`, '#22c55e');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const livingAfter = newEnemies.filter((e) => e.currentHP > 0);
        if (livingAfter.length === 0) {
          setTimeout(() => {
            addLog('Todos os inimigos derrotados! Vitória!', '#22c55e');
            const activeId = teamFightersRef.current[activeTeamIdxRef.current]?.ownedId;
            if (activeId) grantRewards(activeId);
            setWinner('player');
            setPhase('result');
            setBusy(false);
          }, 400);
          return;
        }
        const nextIdx = newEnemies.findIndex((e) => e.currentHP > 0);
        targetIdxRef.current = nextIdx;
        setTargetIdx(nextIdx);
        addLog(`Alvo mudou para ${newEnemies[nextIdx].name}!`, '#f59e0b');
      }

      doBenchThenCounter(bench, idx + 1);
    }, 400);
  }

  // ── Player action ──────────────────────────────────────────────────────────
  function handleAction(action: ActionType) {
    const currentEnemies = enemiesRef.current;
    const currentTeam = teamFightersRef.current;
    const currentPF = currentTeam[activeTeamIdxRef.current];
    const target = currentEnemies[targetIdxRef.current];

    if (busy || !currentPF || !target || phase !== 'battle' || winner !== null) return;
    if (currentPF.currentHP <= 0 || target.currentHP <= 0) return;
    if (action === 'SPIRIT' && currentPF.currentMP < SPIRIT_MP_COST) return;

    setBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // ── Multi-target spirit (hits ALL living enemies) ─────────────────────────
    if (action === 'SPIRIT' && currentPF.spiritHitsAll) {
      const spiritNewMP = Math.max(0, currentPF.currentMP - SPIRIT_MP_COST);
      const spiritAttacker = { ...currentPF, currentMP: SPIRIT_MP_COST };
      const liveIndices = currentEnemies
        .map((e, i) => ({ e, i }))
        .filter(({ e }) => e.currentHP > 0);

      const updatedEnemiesAll = [...currentEnemies];
      for (const { e: enemy, i: idx } of liveIndices) {
        const res = executeTurn(spiritAttacker, enemy, 'SPIRIT');
        const newHP = res.defenderResult.newHP;
        updatedEnemiesAll[idx] = { ...enemy, currentHP: newHP };
        const lc = res.defenderResult.attrMult > 1 || res.defenderResult.elemMult > 1
          ? '#22c55e' : colors.foreground;
        addLog(res.defenderResult.log, lc);
        shake(getEnemyShake(idx));
        flashElementHit(currentPF.element, idx);
        if (newHP <= 0) {
          addLog(`${enemy.name} foi derrotado!`, '#22c55e');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }

      setEnemies(updatedEnemiesAll);
      enemiesRef.current = updatedEnemiesAll;

      const updatedTeamAll = currentTeam.map((t, i) =>
        i === activeTeamIdxRef.current ? { ...t, currentMP: spiritNewMP } : t
      );
      setTeamFighters(updatedTeamAll);
      teamFightersRef.current = updatedTeamAll;

      const livingAfterAll = updatedEnemiesAll.filter((e) => e.currentHP > 0);
      if (livingAfterAll.length === 0) {
        setTimeout(() => {
          addLog('Todos os inimigos derrotados! Vitória!', '#22c55e');
          const activeId = teamFightersRef.current[activeTeamIdxRef.current]?.ownedId;
          if (activeId) grantRewards(activeId);
          setWinner('player');
          setPhase('result');
          setBusy(false);
        }, 400);
        return;
      }
      const nextIdxAll = updatedEnemiesAll.findIndex((e) => e.currentHP > 0);
      if (nextIdxAll >= 0) { targetIdxRef.current = nextIdxAll; setTargetIdx(nextIdxAll); }
      setTimeout(() => {
        const updatedPF = teamFightersRef.current[activeTeamIdxRef.current];
        if (!updatedPF || updatedPF.currentHP <= 0) { setBusy(false); return; }
        doEnemiesCounterAttack(updatedPF, enemiesRef.current);
      }, 600);
      return;
    }

    // ── Single-target (normal ATTACK or SPIRIT) ───────────────────────────────
    const pResult = executeTurn(currentPF, target, action);
    const newPlayerMP = pResult.attackerResult.newMP;
    const newTargetHP = pResult.defenderResult.newHP;

    const lc = pResult.defenderResult.attrMult > 1 || pResult.defenderResult.elemMult > 1
      ? '#22c55e' : colors.foreground;
    addLog(pResult.defenderResult.log, lc);
    shake(getEnemyShake(targetIdxRef.current));
    flashElementHit(currentPF.element, targetIdxRef.current);

    // Update attacked enemy
    const updatedEnemies = currentEnemies.map((e, i) =>
      i === targetIdxRef.current ? { ...e, currentHP: newTargetHP } : e
    );
    setEnemies(updatedEnemies);
    enemiesRef.current = updatedEnemies;

    // Update player MP
    const updatedTeam = currentTeam.map((t, i) =>
      i === activeTeamIdxRef.current ? { ...t, currentMP: newPlayerMP } : t
    );
    setTeamFighters(updatedTeam);
    teamFightersRef.current = updatedTeam;

    // Check if attacked enemy died — auto-target next living enemy
    if (newTargetHP <= 0) {
      const deadEnemy = currentEnemies[targetIdxRef.current];
      addLog(`${deadEnemy.name} foi derrotado!`, '#22c55e');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const livingAfter = updatedEnemies.filter((e) => e.currentHP > 0);
      if (livingAfter.length === 0) {
        // All enemies defeated!
        setTimeout(() => {
          addLog('Todos os inimigos derrotados! Vitória!', '#22c55e');
          const activeId = teamFightersRef.current[activeTeamIdxRef.current]?.ownedId;
          if (activeId) grantRewards(activeId);
          setWinner('player');
          setPhase('result');
          setBusy(false);
        }, 400);
        return;
      }

      // Auto-target first living enemy
      const nextTargetIdx = updatedEnemies.findIndex((e) => e.currentHP > 0);
      targetIdxRef.current = nextTargetIdx;
      setTargetIdx(nextTargetIdx);
      addLog(`Alvo mudou para ${updatedEnemies[nextTargetIdx].name}!`, '#f59e0b');
    }

    // Bench fighters attack, then enemies counter-attack
    const bench = teamFightersRef.current.filter(
      (t, i) => i !== activeTeamIdxRef.current && t.currentHP > 0
    );
    setTimeout(() => doBenchThenCounter(bench, 0), 400);
  }

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (!stage || !map) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <Text style={[styles.errorText, { color: colors.destructive }]}>Estágio não encontrado</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: colors.primary }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stageCharIds = stage.enemyCharacterIds ?? [stage.enemyCharacterId];
  const canSpirit = !!playerFighter && playerFighter.currentMP >= SPIRIT_MP_COST;
  const livingEnemies = enemies.filter((e) => e.currentHP > 0);
  const pOwned = teamFighters[activeTeamIdx]
    ? collection.find((c) => c.ownedId === teamFighters[activeTeamIdx].ownedId)
    : null;
  const pChar = pOwned ? CHARACTERS[pOwned.characterId] : null;

  function toggleTeam(ownedId: string) {
    setSelectedTeam((prev) => {
      if (prev.includes(ownedId)) return prev.filter((id) => id !== ownedId);
      if (prev.length >= 3) return prev;
      return [...prev, ownedId];
    });
  }

  // ─── SELECT ────────────────────────────────────────────────────────────────
  if (phase === 'select') {
    const firstEnemyChar = CHARACTERS[stageCharIds[0]];
    const firstEnemyAttr = firstEnemyChar ? ATTRIBUTES[firstEnemyChar.attribute] : null;

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{stage.name}</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Enemy preview — background only, enemies listed below */}
        <View style={[styles.enemyPreviewCard, { borderColor: firstEnemyAttr ? firstEnemyAttr.color + '88' : colors.border }]}>
          {map.backgroundImage ? (
            <ImageBackground source={map.backgroundImage} style={styles.previewBg} imageStyle={{ resizeMode: 'cover' }} />
          ) : (
            <View style={[styles.previewBgOverlay, { backgroundColor: colors.card, minHeight: 140 }]} />
          )}
          <View style={[styles.previewInfo, { backgroundColor: colors.card }]}>
            <Text style={[styles.enemyLevel, { color: colors.primary }]}>Nível {stage.enemyLevel}</Text>
            <View style={[styles.expBadge, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}>
              <Feather name="award" size={12} color={colors.primary} />
              <Text style={[styles.expBadgeText, { color: colors.primary }]}>+{stage.expReward} EXP</Text>
            </View>
            <Text style={[styles.possibleLabel, { color: colors.mutedForeground }]}>
              Possíveis aparições: {stageCharIds.map((id) => CHARACTERS[id]?.name ?? id).join(', ')}
            </Text>
          </View>
        </View>

        {/* Team builder */}
        <Text style={[styles.chooseLabel, { color: colors.mutedForeground }]}>
          MONTE SUA EQUIPE ({selectedTeam.length}/3)
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.selectList}
        >
          {collection.map((owned) => {
            const c = CHARACTERS[owned.characterId];
            const pos = selectedTeam.indexOf(owned.ownedId);
            const inTeam = pos !== -1;
            return (
              <TouchableOpacity
                key={owned.ownedId}
                onPress={() => toggleTeam(owned.ownedId)}
                activeOpacity={0.8}
                style={[
                  styles.selectCard,
                  {
                    backgroundColor: inTeam ? colors.primary + '22' : colors.card,
                    borderColor: inTeam ? colors.primary : colors.border,
                  },
                ]}
              >
                {inTeam && (
                  <View style={[styles.teamPosBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.teamPosBadgeText}>{pos + 1}</Text>
                  </View>
                )}
                <CharacterAvatar characterId={owned.characterId} size={64} />
                <Text style={[styles.selectName, { color: colors.foreground }]}>{c?.name}</Text>
                <Text style={[styles.selectLevel, { color: colors.primary }]}>Lv {owned.level}</Text>
                <AttributeBadge attr={c?.attribute ?? 'NO'} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          onPress={() => { if (selectedTeam.length > 0) startBattle(selectedTeam); }}
          activeOpacity={selectedTeam.length > 0 ? 0.8 : 1}
          style={[
            styles.startBattleBtn,
            {
              backgroundColor: selectedTeam.length > 0 ? '#ef4444' : colors.card,
              borderColor: selectedTeam.length > 0 ? '#ef4444' : colors.border,
              marginBottom: botPad + 16,
            },
          ]}
        >
          <Feather name="crosshair" size={20} color={selectedTeam.length > 0 ? '#fff' : colors.mutedForeground} />
          <Text style={[styles.startBattleBtnText, { color: selectedTeam.length > 0 ? '#fff' : colors.mutedForeground }]}>
            {selectedTeam.length > 0
              ? `Batalhar! (${selectedTeam.length} Digimon)`
              : 'Selecione ao menos 1 Digimon'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── BATTLE ────────────────────────────────────────────────────────────────
  if (phase === 'battle' && playerFighter) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.battleHeader, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
          <Text style={[styles.battleTitle, { color: colors.foreground }]}>{stage.name}</Text>
          {enemies.length > 1 && (
            <View style={[styles.enemyCountBadge, { backgroundColor: '#ef444422', borderColor: '#ef4444' }]}>
              <Text style={styles.enemyCountText}>
                {livingEnemies.length}/{enemies.length} vivos
              </Text>
            </View>
          )}
        </View>

        {/* Arena: all enemies at once */}
        {map.backgroundImage ? (
          <ImageBackground source={map.backgroundImage} style={styles.arena} imageStyle={styles.arenaImage}>
            <View style={styles.arenaOverlay}>
              <View style={styles.arenaEnemyRow}>
                {enemies.map((enemy, i) => {
                  const charId = battleCharIds[i] ?? stageCharIds[i] ?? stageCharIds[0];
                  const eChar = CHARACTERS[charId];
                  const eAttr = eChar ? ATTRIBUTES[eChar.attribute] : null;
                  const isTarget = i === targetIdx;
                  const isDead = enemy.currentHP <= 0;
                  const maxHP = getScaledStats(eChar?.baseStats ?? enemy.stats, stage.enemyLevel).hp;
                  return (
                    <TouchableOpacity
                      key={i}
                      activeOpacity={isDead ? 1 : 0.85}
                      onPress={() => { if (!isDead && !busy) { targetIdxRef.current = i; setTargetIdx(i); } }}
                      style={[styles.arenaEnemySlot, isDead && styles.arenaEnemyDead]}
                    >
                      {/* Target ring */}
                      {isTarget && !isDead && (
                        <View style={[styles.targetRing, { borderColor: '#ef4444' }]} />
                      )}
                      <Animated.View style={{ transform: [{ translateX: getEnemyShake(i) }] }}>
                        {CHARACTER_IMAGES[charId] ? (
                          <Image
                            source={CHARACTER_IMAGES[charId]}
                            style={[styles.arenaEnemySprite, enemies.length === 1 && styles.arenaSingleSprite]}
                            resizeMode="contain"
                          />
                        ) : (
                          <CharacterAvatar characterId={charId} size={enemies.length === 1 ? 90 : 64} plain />
                        )}
                        {hitFlash?.idx === i && (
                          <HitEffect key={hitFlash.key} color={ELEMENTS[hitFlash.element]?.color ?? '#ffffff'} />
                        )}
                      </Animated.View>
                      <View style={[styles.arenaEnemyInfo, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                        <Text style={styles.arenaEnemyName} numberOfLines={1}>{enemy.name}</Text>
                        <View style={[styles.arenaEnemyHpTrack, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                          <View style={[
                            styles.arenaEnemyHpFill,
                            {
                              width: `${Math.max(0, (enemy.currentHP / maxHP) * 100)}%` as any,
                              backgroundColor: isDead ? '#6b7280' : (eAttr?.color ?? '#ef4444'),
                            },
                          ]} />
                        </View>
                      </View>
                      {isDead && (
                        <View style={styles.deadOverlay}>
                          <Feather name="x-circle" size={28} color="#ef4444" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ImageBackground>
        ) : (
          <View style={[styles.arenaFallback, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <View style={styles.arenaEnemyRow}>
              {enemies.map((enemy, i) => {
                const charId = battleCharIds[i] ?? stageCharIds[i] ?? stageCharIds[0];
                const eChar = CHARACTERS[charId];
                const eAttr = eChar ? ATTRIBUTES[eChar.attribute] : null;
                const isTarget = i === targetIdx;
                const isDead = enemy.currentHP <= 0;
                const maxHP = getScaledStats(eChar?.baseStats ?? enemy.stats, stage.enemyLevel).hp;
                return (
                  <TouchableOpacity
                    key={i}
                    activeOpacity={isDead ? 1 : 0.85}
                    onPress={() => { if (!isDead && !busy) { targetIdxRef.current = i; setTargetIdx(i); } }}
                    style={[styles.arenaEnemySlot, isDead && styles.arenaEnemyDead]}
                  >
                    {isTarget && !isDead && (
                      <View style={[styles.targetRing, { borderColor: colors.primary }]} />
                    )}
                    <Animated.View style={{ transform: [{ translateX: getEnemyShake(i) }] }}>
                      <CharacterAvatar characterId={charId} size={enemies.length === 1 ? 90 : 64} borderColor="transparent" bgColor="transparent" />
                      {hitFlash?.idx === i && (
                        <HitEffect key={hitFlash.key} color={ELEMENTS[hitFlash.element]?.color ?? '#ffffff'} />
                      )}
                    </Animated.View>
                    <View style={[styles.arenaEnemyInfo, { backgroundColor: colors.card }]}>
                      <Text style={[styles.arenaEnemyName, { color: colors.foreground }]} numberOfLines={1}>{enemy.name}</Text>
                      <View style={[styles.arenaEnemyHpTrack, { backgroundColor: colors.border }]}>
                        <View style={[
                          styles.arenaEnemyHpFill,
                          {
                            width: `${Math.max(0, (enemy.currentHP / maxHP) * 100)}%` as any,
                            backgroundColor: isDead ? '#6b7280' : (eAttr?.color ?? colors.primary),
                          },
                        ]} />
                      </View>
                    </View>
                    {isDead && (
                      <View style={styles.deadOverlay}>
                        <Feather name="x-circle" size={28} color="#ef4444" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {enemies.length > 1 && (
          <Text style={[styles.targetHint, { color: colors.mutedForeground }]}>
            Toque num inimigo para selecionar o alvo
          </Text>
        )}

        {/* Battle log */}
        <ScrollView
          ref={logRef}
          style={[styles.logBox, { backgroundColor: colors.card, borderColor: colors.border }]}
          contentContainerStyle={styles.logContent}
          showsVerticalScrollIndicator={false}
        >
          {log.map((entry, i) => (
            <Text key={i} style={[styles.logEntry, { color: entry.color }]}>{entry.text}</Text>
          ))}
        </ScrollView>

        {/* Player + team strip */}
        <View style={[styles.playerSection, { borderTopColor: colors.border }]}>
          <HPBar
            current={playerFighter.currentHP}
            max={getScaledStats(pChar?.baseStats ?? playerFighter.stats, pOwned?.level ?? 1).hp}
            color={colors.primary}
          />
          <View style={styles.playerInfoRow}>
            <View>
              <Text style={[styles.fighterName, { color: colors.foreground }]}>{playerFighter.name}</Text>
              <Text style={[styles.mpText, { color: '#a855f7' }]}>
                MP {playerFighter.currentMP}/{playerFighter.stats.mp}
              </Text>
            </View>
            <Animated.View style={{ transform: [{ translateX: playerShake }] }}>
              <View style={{ position: 'relative' }}>
                <CharacterAvatar characterId={pOwned?.characterId ?? ''} size={64} />
                {playerHitFlash && (
                  <HitEffect key={playerHitFlash.key} color={ELEMENTS[playerHitFlash.element]?.color ?? '#ffffff'} />
                )}
              </View>
            </Animated.View>
          </View>

          {teamFighters.length > 1 && (
            <View style={styles.teamStrip}>
              {teamFighters.map((tf, i) => {
                const tfOwned = collection.find((c) => c.ownedId === tf.ownedId);
                const tfChar = tfOwned ? CHARACTERS[tfOwned.characterId] : null;
                const maxHP = tfChar ? getScaledStats(tfChar.baseStats, tfOwned?.level ?? 1).hp : tf.stats.hp;
                const isActive = i === activeTeamIdx;
                const dead = tf.currentHP <= 0;
                return (
                  <TouchableOpacity
                    key={tf.ownedId}
                    activeOpacity={dead || busy || autoMode ? 1 : 0.75}
                    onPress={() => {
                      if (!dead && !busy && !autoMode && i !== activeTeamIdx) {
                        activeTeamIdxRef.current = i;
                        setActiveTeamIdx(i);
                      }
                    }}
                    style={[
                      styles.teamChip,
                      { borderColor: isActive ? colors.primary : colors.border, opacity: dead ? 0.35 : 1 },
                      isActive && { backgroundColor: colors.primary + '18' },
                    ]}
                  >
                    {isActive && (
                      <View style={[styles.teamChipActiveDot, { backgroundColor: colors.primary }]} />
                    )}
                    <CharacterAvatar characterId={tfOwned?.characterId ?? ''} size={28} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[styles.teamChipName, { color: isActive ? colors.primary : colors.mutedForeground }]} numberOfLines={1}>
                        {tfChar?.name ?? '—'}
                      </Text>
                      <View style={[styles.teamChipHpTrack, { backgroundColor: colors.border }]}>
                        <View style={[styles.teamChipHpFill, {
                          width: `${Math.max(0, (tf.currentHP / maxHP) * 100)}%` as any,
                          backgroundColor: dead ? '#ef4444' : isActive ? colors.primary : '#22c55e',
                        }]} />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={[styles.actions, { paddingBottom: botPad + 8, borderTopColor: colors.border }]}>
          {!autoMode && (
            <>
              <TouchableOpacity
                activeOpacity={busy ? 1 : 0.8}
                onPress={() => handleAction('ATTACK')}
                style={[styles.actionBtn, { backgroundColor: '#ef4444' + (busy ? '11' : '22'), borderColor: busy ? colors.border : '#ef4444' }]}
              >
                <Feather name="crosshair" size={22} color={busy ? colors.mutedForeground : '#ef4444'} />
                <Text style={[styles.actionBtnLabel, { color: busy ? colors.mutedForeground : '#ef4444' }]}>
                  {playerFighter.attackName ?? 'Ataque'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={busy || !canSpirit ? 1 : 0.8}
                onPress={() => !busy && canSpirit && handleAction('SPIRIT')}
                style={[styles.actionBtn, {
                  backgroundColor: '#a855f7' + (!canSpirit || busy ? '11' : '22'),
                  borderColor: !canSpirit || busy ? colors.border : '#a855f7',
                }]}
              >
                <Feather name="star" size={22} color={!canSpirit || busy ? colors.mutedForeground : '#a855f7'} />
                <Text style={[styles.actionBtnLabel, { color: !canSpirit || busy ? colors.mutedForeground : '#a855f7' }]}>
                  {playerFighter.spiritName ?? 'Espírito'} ({SPIRIT_MP_COST} MP)
                </Text>
              </TouchableOpacity>
            </>
          )}
          {autoMode && (
            <View style={[styles.autoIndicator, { backgroundColor: '#22c55e11', borderColor: '#22c55e' }]}>
              <Image source={AUTO_BATTLE_IMG} style={{ width: 22, height: 22 }} resizeMode="contain" />
              <Text style={[styles.autoIndicatorText, { color: '#22c55e' }]}>Batalha Automática…</Text>
            </View>
          )}
          {(alreadyCleared || map.isDungeon) && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => { setAutoMode((p) => { const n = !p; if (n) setAutoRunCount(0); return n; }); }}
              style={[styles.autoBtn, { backgroundColor: autoMode ? '#22c55e22' : colors.card, borderColor: autoMode ? '#22c55e' : colors.border }]}
            >
              <Image source={AUTO_BATTLE_IMG} style={{ width: 18, height: 18, opacity: autoMode ? 1 : 0.5 }} resizeMode="contain" />
              <Text style={[styles.autoBtnLabel, { color: autoMode ? '#22c55e' : colors.mutedForeground }]}>
                {autoMode ? 'Pausar' : 'Auto'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // ─── RESULT ─────────────────────────────────────────────────────────────────
  if (phase === 'result') {
    const won = winner === 'player';
    const autoRunning = autoMode && won && autoRunCount < AUTO_RUN_MAX;
    const hasNextStage = !!(map?.stages[stageIndex + 1]);

    return (
      <View style={[styles.container, styles.resultCenter, { backgroundColor: colors.background }]}>
        <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: won ? '#22c55e' : '#ef4444' }]}>
          <Feather name={won ? 'award' : 'x-circle'} size={64} color={won ? '#22c55e' : '#ef4444'} />
          <Text style={[styles.resultTitle, { color: won ? '#22c55e' : '#ef4444' }]}>
            {won ? 'Vitória!' : 'Derrota'}
          </Text>
          {won && stage && (() => {
            const ec = (stage.enemyCharacterIds ?? [stage.enemyCharacterId]).filter(Boolean).length;
            const totalXp = stage.expReward * ec;
            return (
              <View style={[styles.rewardBox, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}>
                <Feather name="award" size={16} color={colors.primary} />
                <Text style={[styles.rewardText, { color: colors.primary }]}>
                  +{totalXp} EXP ganhos{ec > 1 ? ` (${ec}× inimigos)` : ''}!
                </Text>
              </View>
            );
          })()}

          {/* Auto-battle indicators */}
          {autoRunning && (
            <View style={[styles.autoRestartBanner, { backgroundColor: '#22c55e11', borderColor: '#22c55e55' }]}>
              <Feather name="zap" size={14} color="#22c55e" />
              <Text style={[styles.autoRestartText, { color: '#22c55e' }]}>
                Reiniciando… ({autoRunCount}/{AUTO_RUN_MAX})
              </Text>
            </View>
          )}
          {autoMode && won && autoRunCount >= AUTO_RUN_MAX && (
            <View style={[styles.autoRestartBanner, { backgroundColor: '#f59e0b11', borderColor: '#f59e0b55' }]}>
              <Feather name="check-circle" size={14} color="#f59e0b" />
              <Text style={[styles.autoRestartText, { color: '#f59e0b' }]}>Auto concluído! ({AUTO_RUN_MAX}/{AUTO_RUN_MAX})</Text>
            </View>
          )}
          {autoMode && won && (
            <TouchableOpacity onPress={() => { setAutoMode(false); setAutoRunCount(0); }} style={[styles.resultBtnOutline, { borderColor: '#ef4444' }]}>
              <Text style={[styles.resultBtnText, { color: '#ef4444' }]}>Cancelar Auto</Text>
            </TouchableOpacity>
          )}

          {/* Post-battle action buttons (shown when not in auto-loop) */}
          {!autoRunning && (
            <View style={styles.resultActions}>
              <TouchableOpacity
                onPress={() => router.replace(`/battle?mapId=${mapId}&stageIndex=${stageIndex}`)}
                style={[styles.resultBtn, { backgroundColor: colors.primary }]}
              >
                <Feather name="refresh-cw" size={15} color={colors.primaryForeground} />
                <Text style={[styles.resultBtnText, { color: colors.primaryForeground }]}>Batalhar Novamente</Text>
              </TouchableOpacity>
              {won && hasNextStage && (
                <TouchableOpacity
                  onPress={() => router.replace(`/battle?mapId=${mapId}&stageIndex=${stageIndex + 1}`)}
                  style={[styles.resultBtnOutline, { borderColor: '#22c55e' }]}
                >
                  <Feather name="chevrons-right" size={15} color="#22c55e" />
                  <Text style={[styles.resultBtnText, { color: '#22c55e' }]}>Próxima Fase</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => router.replace('/(tabs)/map')}
                style={[styles.resultBtnOutline, { borderColor: colors.border }]}
              >
                <Feather name="map" size={15} color={colors.mutedForeground} />
                <Text style={[styles.resultBtnText, { color: colors.mutedForeground }]}>Voltar ao Mapa</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  errorText: { textAlign: 'center', fontSize: 16, margin: 40 },
  backBtn: { padding: 4 },

  // ── Header ──
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700' as const },
  battleHeader: { paddingHorizontal: 20, paddingBottom: 8, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  battleTitle: { fontSize: 16, fontWeight: '700' as const },
  enemyCountBadge: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3 },
  enemyCountText: { fontSize: 12, fontWeight: '800' as const, color: '#ef4444' },

  // ── Select ──
  enemyPreviewCard: { margin: 20, borderRadius: 16, borderWidth: 1.5, overflow: 'hidden' },
  previewBg: { width: '100%', height: 150 },
  previewBgOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6 },
  previewLabel: { fontSize: 10, fontWeight: '800' as const, letterSpacing: 1.5, color: '#ffffffcc' },
  previewEnemyRow: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
  previewSprite: { width: 90, height: 90 },
  previewInfo: { alignItems: 'center', gap: 8, padding: 14 },
  enemyNameLg: { fontSize: 16, fontWeight: '800' as const, textAlign: 'center' },
  enemyLevel: { fontSize: 13, fontWeight: '700' as const },
  expBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4 },
  expBadgeText: { fontSize: 13, fontWeight: '700' as const },
  possibleLabel: { fontSize: 11, fontWeight: '500' as const, textAlign: 'center', marginTop: 6 },
  chooseLabel: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 1, paddingHorizontal: 20, marginBottom: 10 },
  selectList: { paddingHorizontal: 20, paddingBottom: 20, gap: 12 },
  selectCard: { width: 120, borderRadius: 14, borderWidth: 1.5, padding: 14, alignItems: 'center', gap: 8, position: 'relative' as const },
  teamPosBadge: { position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  teamPosBadgeText: { fontSize: 11, fontWeight: '800' as const, color: '#fff' },
  selectName: { fontSize: 14, fontWeight: '700' as const },
  selectLevel: { fontSize: 12, fontWeight: '600' as const },
  startBattleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: 20, borderRadius: 16, borderWidth: 1.5, paddingVertical: 16 },
  startBattleBtnText: { fontSize: 15, fontWeight: '800' as const },

  // ── Arena with simultaneous enemies ──
  arena: { width: '100%', height: 220 },
  arenaImage: { resizeMode: 'cover' as const },
  arenaOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  arenaFallback: { width: '100%', height: 180, borderBottomWidth: 1, justifyContent: 'center', alignItems: 'center' },
  arenaEnemyRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 8, flexWrap: 'wrap' },
  arenaEnemySlot: { alignItems: 'center', gap: 4, position: 'relative' as const, minWidth: 80 },
  arenaEnemyDead: { opacity: 0.4 },
  targetRing: { position: 'absolute', top: -4, left: -4, right: -4, bottom: 20, borderRadius: 12, borderWidth: 2.5, zIndex: 1 },
  elementFlashImg: { position: 'absolute', width: 72, height: 72, zIndex: 20, pointerEvents: 'none' as const },
  arenaEnemySprite: { width: 72, height: 72 },
  arenaSingleSprite: { width: 110, height: 110 },
  arenaEnemyInfo: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3, alignItems: 'center', gap: 2, minWidth: 72 },
  arenaEnemyName: { fontSize: 10, fontWeight: '700' as const, color: '#ffffff', textAlign: 'center' },
  arenaEnemyHpTrack: { width: '100%', height: 4, borderRadius: 2, overflow: 'hidden' as const, minWidth: 60 },
  arenaEnemyHpFill: { height: 4, borderRadius: 2 },
  deadOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  targetHint: { fontSize: 10, textAlign: 'center', paddingVertical: 4 },

  // ── Player section ──
  playerSection: { borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 10, gap: 6 },
  playerInfoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fighterName: { fontSize: 16, fontWeight: '700' as const },
  mpText: { fontSize: 12, fontWeight: '600' as const },
  teamStrip: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' as const },
  teamChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, borderWidth: 1.5, padding: 5, position: 'relative' as const },
  teamChipActiveDot: { position: 'absolute' as const, top: -4, right: -4, width: 8, height: 8, borderRadius: 4 },
  teamChipName: { fontSize: 10, fontWeight: '600' as const },
  teamChipHpTrack: { height: 5, borderRadius: 3, overflow: 'hidden' as const },
  teamChipHpFill: { height: 5, borderRadius: 3 },

  // ── Log ──
  logBox: { flex: 1, marginHorizontal: 16, borderRadius: 12, borderWidth: 1, maxHeight: 110 },
  logContent: { padding: 10, gap: 3 },
  logEntry: { fontSize: 12, lineHeight: 17 },

  // ── Actions ──
  actions: { flexDirection: 'row', gap: 10, padding: 12, paddingTop: 10, borderTopWidth: 1 },
  actionBtn: { flex: 1, borderRadius: 14, borderWidth: 1.5, padding: 14, alignItems: 'center', gap: 5 },
  actionBtnLabel: { fontSize: 12, fontWeight: '700' as const },
  autoIndicator: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, borderWidth: 1.5, padding: 14 },
  autoIndicatorText: { fontSize: 14, fontWeight: '700' as const },
  autoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, borderWidth: 1.5, paddingVertical: 10, paddingHorizontal: 14 },
  autoBtnLabel: { fontSize: 12, fontWeight: '700' as const },

  // ── Result ──
  resultCenter: { alignItems: 'center', justifyContent: 'center' },
  resultCard: { width: '80%', borderRadius: 20, borderWidth: 2, padding: 32, alignItems: 'center', gap: 16 },
  resultTitle: { fontSize: 32, fontWeight: '900' as const },
  rewardBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  rewardText: { fontSize: 14, fontWeight: '700' as const },
  resultActions: { width: '100%', gap: 10 },
  resultBtn: { width: '100%', borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  resultBtnOutline: { width: '100%', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  resultBtnText: { fontSize: 15, fontWeight: '700' as const },
  autoRestartBanner: { width: '100%', borderRadius: 12, borderWidth: 1, padding: 12, alignItems: 'center', gap: 4 },
  autoRestartText: { fontSize: 13, fontWeight: '700' as const },
});
