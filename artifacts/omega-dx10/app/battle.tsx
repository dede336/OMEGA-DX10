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
  GAME_MAPS,
  EQUIPMENT_ITEMS,
  EQUIP_SLOTS_ORDER,
  getScaledStats,
} from '@/constants/gameData';
import CHARACTER_IMAGES from '@/constants/characterImages';
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
  } = useGame();

  const mapId = params.mapId ?? '';
  const stageIndex = Number(params.stageIndex ?? '0');
  const map = GAME_MAPS.find((m) => m.id === mapId);
  const stage = map?.stages[stageIndex];
  const alreadyCleared = isStageCleared(mapId, stageIndex);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  // ── Phase / result ──────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('select');
  const [winner, setWinner] = useState<'player' | 'enemy' | null>(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<BattleLog[]>([]);
  const logRef = useRef<ScrollView>(null);

  // ── Team selection (select phase) ───────────────────────────────────────────
  const initialTeam = team.length > 0 ? team : (selectedCharacter ? [selectedCharacter.ownedId] : []);
  const [selectedTeam, setSelectedTeam] = useState<string[]>(initialTeam);
  const selectedTeamRef = useRef<string[]>(initialTeam);
  useEffect(() => { selectedTeamRef.current = selectedTeam; }, [selectedTeam]);

  // ── Battle team fighters ────────────────────────────────────────────────────
  const [teamFighters, setTeamFighters] = useState<TeamFighter[]>([]);
  const [activeTeamIdx, setActiveTeamIdx] = useState(0);
  const teamFightersRef = useRef<TeamFighter[]>([]);
  const activeTeamIdxRef = useRef(0);
  useEffect(() => { teamFightersRef.current = teamFighters; }, [teamFighters]);
  useEffect(() => { activeTeamIdxRef.current = activeTeamIdx; }, [activeTeamIdx]);

  // ── Enemy queue ─────────────────────────────────────────────────────────────
  const [enemyQueue, setEnemyQueue] = useState<string[]>([]);
  const [currentEnemyIdx, setCurrentEnemyIdx] = useState(0);
  const enemyQueueRef = useRef<string[]>([]);
  const currentEnemyIdxRef = useRef(0);
  useEffect(() => { enemyQueueRef.current = enemyQueue; }, [enemyQueue]);
  useEffect(() => { currentEnemyIdxRef.current = currentEnemyIdx; }, [currentEnemyIdx]);

  // ── Active fighters ─────────────────────────────────────────────────────────
  const [playerFighter, setPlayerFighter] = useState<BattleFighter | null>(null);
  const [enemyFighter, setEnemyFighter] = useState<BattleFighter | null>(null);
  const enemyFighterRef = useRef<BattleFighter | null>(null);
  useEffect(() => { enemyFighterRef.current = enemyFighter; }, [enemyFighter]);

  // ── Auto battle ─────────────────────────────────────────────────────────────
  const [autoMode, setAutoMode] = useState(false);
  const [autoRunCount, setAutoRunCount] = useState(0);
  const autoModeRef = useRef(false);
  const autoRunCountRef = useRef(0);
  const AUTO_RUN_MAX = 10;
  useEffect(() => { autoModeRef.current = autoMode; }, [autoMode]);
  useEffect(() => { autoRunCountRef.current = autoRunCount; }, [autoRunCount]);

  // ── Animations ──────────────────────────────────────────────────────────────
  const playerShake = useRef(new Animated.Value(0)).current;
  const enemyShake = useRef(new Animated.Value(0)).current;
  const shake = useCallback((anim: Animated.Value) => {
    Animated.sequence([
      Animated.timing(anim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Auto-battle tick ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!autoMode || busy || phase !== 'battle' || winner !== null) return;
    const timer = setTimeout(() => { if (autoModeRef.current) handleAction('ATTACK'); }, 700);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMode, busy, phase, winner]);

  // ── Auto-restart after win ──────────────────────────────────────────────────
  useEffect(() => {
    if (!autoMode || winner !== 'player') return;
    if (autoRunCountRef.current >= AUTO_RUN_MAX) { setAutoMode(false); return; }
    const timer = setTimeout(() => {
      if (!autoModeRef.current) return;
      setAutoRunCount((p) => p + 1);
      startBattle(selectedTeamRef.current);
    }, 3000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMode, winner]);

  function addLog(text: string, color: string = colors.foreground) {
    setLog((prev) => [...prev, { text, color }]);
    setTimeout(() => logRef.current?.scrollToEnd({ animated: true }), 100);
  }

  // ── Build equip bonuses ─────────────────────────────────────────────────────
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

  // ── Build enemy fighter ─────────────────────────────────────────────────────
  function buildEnemy(charId: string): BattleFighter {
    const eChar = CHARACTERS[charId];
    let f = buildFighter(eChar.name, eChar.attribute, eChar.element, eChar.baseStats, stage!.enemyLevel);
    if (stage!.bossMultipliers) {
      const bm = stage!.bossMultipliers;
      const hp = bm.hp ? Math.floor(f.stats.hp * bm.hp) : f.stats.hp;
      const def = bm.def ? Math.floor(f.stats.def * bm.def) : f.stats.def;
      f = { ...f, currentHP: hp, stats: { ...f.stats, hp, def } };
    }
    return f;
  }

  // ── Grant victory rewards ───────────────────────────────────────────────────
  function grantRewards(activeOwnedId: string) {
    const xp = stage?.expReward ?? 0;
    gainExp(activeOwnedId, xp);

    const dv = equippedItems.digivice
      ? EQUIPMENT_ITEMS.find((i) => i.id === equippedItems.digivice)
      : null;
    if (dv?.xpSharePercent && xp > 0) {
      const shared = Math.floor(xp * dv.xpSharePercent);
      if (shared > 0) {
        const bench = teamFightersRef.current.filter((t) => t.ownedId !== activeOwnedId);
        bench.forEach((t) => gainExp(t.ownedId, shared));
        if (bench.length > 0) addLog(`📡 +${shared} XP compartilhado!`, '#60a5fa');
      }
    }

    const wasCleared = isStageCleared(mapId, stageIndex);
    clearStage(mapId, stageIndex);
    if (!wasCleared && stage?.firstClearReward) {
      addToInventory(stage.firstClearReward);
      const ri = EQUIPMENT_ITEMS.find((i) => i.id === stage!.firstClearReward);
      addLog(`🎁 ${ri?.name ?? stage.firstClearReward} obtido!`, '#f59e0b');
    }

    const eQueue = enemyQueueRef.current;
    eQueue.forEach((eid) => { if (CHARACTERS[eid]?.rarity === 'COMMON') gainScan(eid, 5); });

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

  // ── Start battle ────────────────────────────────────────────────────────────
  function startBattle(teamIds: string[]) {
    if (!stage || teamIds.length === 0) return;
    const eqBonuses = buildEquipBonuses();
    const fighters: TeamFighter[] = [];
    for (const ownedId of teamIds) {
      const owned = collection.find((c) => c.ownedId === ownedId);
      if (!owned) continue;
      const ch = CHARACTERS[owned.characterId];
      if (!ch) continue;
      fighters.push({ ...buildFighter(ch.name, ch.attribute, ch.element, ch.baseStats, owned.level, eqBonuses), ownedId });
    }
    if (fighters.length === 0) return;

    const queue = stage.enemyCharacterIds ?? [stage.enemyCharacterId];

    teamFightersRef.current = fighters;
    activeTeamIdxRef.current = 0;
    enemyQueueRef.current = queue;
    currentEnemyIdxRef.current = 0;

    setTeamFighters(fighters);
    setActiveTeamIdx(0);
    setEnemyQueue(queue);
    setCurrentEnemyIdx(0);
    setSelectedCharacter(fighters[0].ownedId);
    setTeam(teamIds);

    const firstEnemy = buildEnemy(queue[0]);
    enemyFighterRef.current = firstEnemy;
    setEnemyFighter(firstEnemy);
    setPlayerFighter({ ...fighters[0] });
    setLog([]);
    setWinner(null);
    setBusy(false);
    setPhase('battle');

    const first = whoGoesFirst(fighters[0], firstEnemy);
    addLog(
      first === 'player'
        ? `${fighters[0].name} age primeiro!`
        : `${CHARACTERS[queue[0]]?.name} age primeiro!`,
      colors.primary,
    );
    if (first === 'enemy') setTimeout(() => doEnemyTurn({ ...fighters[0] }, firstEnemy), 800);
  }

  // ── Enemy turn ──────────────────────────────────────────────────────────────
  function doEnemyTurn(pF: BattleFighter, eF: BattleFighter): boolean {
    const action = enemyChooseAction(eF);
    const result = executeTurn(eF, pF, action);

    const newEnemyMP = result.attackerResult.newMP;
    const newPlayerHP = result.defenderResult.newHP;
    const lc = result.defenderResult.attrMult > 1 || result.defenderResult.elemMult > 1
      ? '#ef4444' : colors.foreground;
    addLog(result.defenderResult.log, lc);
    shake(playerShake);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newEF = { ...eF, currentMP: newEnemyMP };
    setEnemyFighter(newEF);
    enemyFighterRef.current = newEF;

    const newPlayerHP2 = newPlayerHP;
    setPlayerFighter((prev) => prev ? { ...prev, currentHP: newPlayerHP2 } : prev);
    const newTeam = teamFightersRef.current.map((t, i) =>
      i === activeTeamIdxRef.current ? { ...t, currentHP: newPlayerHP2 } : t
    );
    setTeamFighters(newTeam);
    teamFightersRef.current = newTeam;

    if (newPlayerHP2 <= 0) {
      setTimeout(() => {
        addLog(`${pF.name} foi derrotado!`, '#ef4444');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const nextIdx = activeTeamIdxRef.current + 1;
        if (nextIdx < teamFightersRef.current.length) {
          const next = teamFightersRef.current[nextIdx];
          addLog(`${next.name} entrou em batalha!`, '#f59e0b');
          activeTeamIdxRef.current = nextIdx;
          setActiveTeamIdx(nextIdx);
          setSelectedCharacter(next.ownedId);
          setPlayerFighter(next);
          setBusy(false);
        } else {
          addLog('Toda a equipe foi derrotada!', '#ef4444');
          setWinner('enemy');
          setPhase('result');
        }
      }, 400);
      return true;
    }
    return false;
  }

  // ── Player action ───────────────────────────────────────────────────────────
  function handleAction(action: ActionType) {
    if (busy || !playerFighter || !enemyFighter || phase !== 'battle' || winner !== null) return;
    if (playerFighter.currentHP <= 0 || enemyFighter.currentHP <= 0) return;
    if (action === 'SPIRIT' && playerFighter.currentMP < SPIRIT_MP_COST) return;

    setBusy(true);

    const pResult = executeTurn(playerFighter, enemyFighter, action);
    const newPlayerMP = pResult.attackerResult.newMP;
    const newEnemyHP = pResult.defenderResult.newHP;
    const lc = pResult.defenderResult.attrMult > 1 || pResult.defenderResult.elemMult > 1
      ? '#22c55e' : colors.foreground;
    addLog(pResult.defenderResult.log, lc);
    shake(enemyShake);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const updatedPlayer: BattleFighter = { ...playerFighter, currentMP: newPlayerMP };
    const updatedEnemy: BattleFighter = { ...enemyFighter, currentHP: newEnemyHP };
    setPlayerFighter(updatedPlayer);
    setEnemyFighter(updatedEnemy);
    enemyFighterRef.current = updatedEnemy;

    const updatedTeam = teamFightersRef.current.map((t, i) =>
      i === activeTeamIdxRef.current ? { ...t, currentMP: newPlayerMP } : t
    );
    setTeamFighters(updatedTeam);
    teamFightersRef.current = updatedTeam;

    if (newEnemyHP <= 0) {
      const nextEnemyIdx = currentEnemyIdxRef.current + 1;
      if (nextEnemyIdx < enemyQueueRef.current.length) {
        setTimeout(() => {
          const nextCharId = enemyQueueRef.current[nextEnemyIdx];
          const nextChar = CHARACTERS[nextCharId];
          addLog(`${updatedEnemy.name} derrotado! ${nextChar?.name} chegou!`, '#22c55e');
          currentEnemyIdxRef.current = nextEnemyIdx;
          setCurrentEnemyIdx(nextEnemyIdx);
          const nextEF = buildEnemy(nextCharId);
          setEnemyFighter(nextEF);
          enemyFighterRef.current = nextEF;
          const curPlayer = teamFightersRef.current[activeTeamIdxRef.current];
          const first = whoGoesFirst(curPlayer, nextEF);
          addLog(
            first === 'player'
              ? `${curPlayer.name} age primeiro!`
              : `${nextChar?.name} age primeiro!`,
            colors.primary,
          );
          if (first === 'enemy') {
            setTimeout(() => {
              const pd = doEnemyTurn(curPlayer, nextEF);
              if (!pd) setBusy(false);
            }, 800);
          } else {
            setBusy(false);
          }
        }, 1200);
      } else {
        setTimeout(() => {
          addLog('Todos os inimigos derrotados! Vitória!', '#22c55e');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          const activeId = teamFightersRef.current[activeTeamIdxRef.current]?.ownedId;
          if (activeId) grantRewards(activeId);
          setWinner('player');
          setPhase('result');
        }, 400);
        setBusy(false);
      }
      return;
    }

    setTimeout(() => {
      const playerDied = doEnemyTurn(updatedPlayer, updatedEnemy);
      if (!playerDied) setBusy(false);
    }, 900);
  }

  // ── Guard ───────────────────────────────────────────────────────────────────
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

  const stageQueue = stage.enemyCharacterIds ?? [stage.enemyCharacterId];
  const activeEnemyId = phase === 'battle'
    ? (enemyQueue[currentEnemyIdx] ?? stage.enemyCharacterId)
    : stageQueue[0];
  const enemyChar = CHARACTERS[activeEnemyId];
  const enemyAttrData = enemyChar ? ATTRIBUTES[enemyChar.attribute] : null;

  function toggleTeam(ownedId: string) {
    setSelectedTeam((prev) => {
      if (prev.includes(ownedId)) return prev.filter((id) => id !== ownedId);
      if (prev.length >= 3) return prev;
      return [...prev, ownedId];
    });
  }

  // ─── SELECT ─────────────────────────────────────────────────────────────────
  if (phase === 'select') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{stage.name}</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Enemy preview */}
        <View style={[styles.enemyPreviewCard, { borderColor: enemyAttrData ? enemyAttrData.color + '88' : colors.border }]}>
          {map.backgroundImage ? (
            <ImageBackground source={map.backgroundImage} style={styles.previewBg} imageStyle={{ resizeMode: 'cover' }}>
              <View style={styles.previewBgOverlay}>
                <Text style={styles.previewLabel}>
                  {stageQueue.length > 1 ? `${stageQueue.length} INIMIGOS` : 'INIMIGO'}
                </Text>
                <View style={styles.previewEnemyRow}>
                  {stageQueue.map((cid) =>
                    CHARACTER_IMAGES[cid] ? (
                      <Image
                        key={cid}
                        source={CHARACTER_IMAGES[cid]}
                        style={[styles.previewSprite, stageQueue.length > 1 && { width: 70, height: 70 }]}
                        resizeMode="contain"
                      />
                    ) : (
                      <CharacterAvatar key={cid} characterId={cid} size={stageQueue.length > 1 ? 60 : 90} />
                    )
                  )}
                </View>
              </View>
            </ImageBackground>
          ) : (
            <View style={[styles.previewBgOverlay, { backgroundColor: colors.card }]}>
              <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>
                {stageQueue.length > 1 ? `${stageQueue.length} INIMIGOS` : 'INIMIGO'}
              </Text>
              <View style={styles.previewEnemyRow}>
                {stageQueue.map((cid) => <CharacterAvatar key={cid} characterId={cid} size={stageQueue.length > 1 ? 60 : 90} />)}
              </View>
            </View>
          )}
          <View style={[styles.previewInfo, { backgroundColor: colors.card }]}>
            <Text style={[styles.enemyNameLg, { color: colors.foreground }]} numberOfLines={1}>
              {stageQueue.map((id) => CHARACTERS[id]?.name ?? id).join(' · ')}
            </Text>
            <Text style={[styles.enemyLevel, { color: colors.primary }]}>Nível {stage.enemyLevel}</Text>
            <View style={[styles.expBadge, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}>
              <Feather name="award" size={12} color={colors.primary} />
              <Text style={[styles.expBadgeText, { color: colors.primary }]}>+{stage.expReward} EXP</Text>
            </View>
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

        {/* Battle button */}
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

  // ─── BATTLE ─────────────────────────────────────────────────────────────────
  if (phase === 'battle' && playerFighter && enemyFighter) {
    const pOwned = collection.find((c) => c.ownedId === teamFighters[activeTeamIdx]?.ownedId);
    const pChar = pOwned ? CHARACTERS[pOwned.characterId] : null;
    const canSpirit = playerFighter.currentMP >= SPIRIT_MP_COST;
    const enemyTotal = enemyQueue.length || stageQueue.length;

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.battleHeader, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
          <Text style={[styles.battleTitle, { color: colors.foreground }]}>{stage.name}</Text>
          {enemyTotal > 1 && (
            <View style={[styles.enemyCountBadge, { backgroundColor: '#ef444422', borderColor: '#ef4444' }]}>
              <Text style={styles.enemyCountText}>{currentEnemyIdx + 1}/{enemyTotal}</Text>
            </View>
          )}
        </View>

        {/* Enemy arena */}
        {map.backgroundImage ? (
          <ImageBackground source={map.backgroundImage} style={styles.arena} imageStyle={styles.arenaImage}>
            <View style={styles.arenaOverlay}>
              <View style={styles.arenaTopRow}>
                <View style={styles.arenaNameBadge}>
                  <Text style={styles.arenaEnemyName}>{enemyFighter.name}</Text>
                  <Text style={styles.arenaEnemyLevel}>Lv {stage.enemyLevel}</Text>
                </View>
              </View>
              <Animated.View style={[styles.arenaSpriteWrapper, { transform: [{ translateX: enemyShake }] }]}>
                {CHARACTER_IMAGES[activeEnemyId] ? (
                  <Image source={CHARACTER_IMAGES[activeEnemyId]} style={styles.arenaSprite} resizeMode="contain" />
                ) : (
                  <CharacterAvatar characterId={activeEnemyId} size={100} />
                )}
              </Animated.View>
              <View style={styles.arenaHpRow}>
                <HPBar
                  current={enemyFighter.currentHP}
                  max={getScaledStats(enemyChar?.baseStats ?? enemyFighter.stats, stage.enemyLevel).hp}
                  color={enemyAttrData?.color ?? '#ef4444'}
                />
              </View>
            </View>
          </ImageBackground>
        ) : (
          <View style={[styles.fighterRow, styles.enemySide]}>
            <View style={styles.fighterInfo}>
              <Text style={[styles.fighterName, { color: colors.foreground }]}>{enemyFighter.name}</Text>
              <Text style={[styles.fighterLevel, { color: colors.mutedForeground }]}>Lv {stage.enemyLevel}</Text>
            </View>
            <Animated.View style={{ transform: [{ translateX: enemyShake }] }}>
              <CharacterAvatar characterId={activeEnemyId} size={80} />
            </Animated.View>
            <HPBar
              current={enemyFighter.currentHP}
              max={getScaledStats(enemyChar?.baseStats ?? enemyFighter.stats, stage.enemyLevel).hp}
              color={enemyAttrData?.color ?? colors.primary}
            />
          </View>
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
        <View style={[styles.fighterRow, styles.playerSide]}>
          <HPBar
            current={playerFighter.currentHP}
            max={getScaledStats(pChar?.baseStats ?? playerFighter.stats, pOwned?.level ?? 1).hp}
            color={colors.primary}
          />
          <View style={styles.mpRow}>
            <Text style={[styles.mpText, { color: '#a855f7' }]}>
              MP: {playerFighter.currentMP}/{playerFighter.stats.mp}
            </Text>
          </View>
          <View style={styles.fighterInfo}>
            <Text style={[styles.fighterName, { color: colors.foreground }]}>{playerFighter.name}</Text>
            <Text style={[styles.fighterLevel, { color: colors.mutedForeground }]}>Lv {pOwned?.level ?? 1}</Text>
          </View>
          <Animated.View style={{ transform: [{ translateX: playerShake }] }}>
            <CharacterAvatar characterId={pOwned?.characterId ?? ''} size={80} />
          </Animated.View>

          {/* Team strip */}
          {teamFighters.length > 1 && (
            <View style={styles.teamStrip}>
              {teamFighters.map((tf, i) => {
                const tfOwned = collection.find((c) => c.ownedId === tf.ownedId);
                const tfChar = tfOwned ? CHARACTERS[tfOwned.characterId] : null;
                const maxHP = tfChar
                  ? getScaledStats(tfChar.baseStats, tfOwned?.level ?? 1).hp
                  : tf.stats.hp;
                const isActive = i === activeTeamIdx;
                const dead = tf.currentHP <= 0;
                return (
                  <View
                    key={tf.ownedId}
                    style={[
                      styles.teamChip,
                      { borderColor: isActive ? colors.primary : colors.border, opacity: dead ? 0.35 : 1 },
                    ]}
                  >
                    <CharacterAvatar characterId={tfOwned?.characterId ?? ''} size={28} />
                    <View style={[styles.teamChipHpTrack, { backgroundColor: colors.border }]}>
                      <View
                        style={[
                          styles.teamChipHpFill,
                          {
                            width: `${Math.max(0, (tf.currentHP / maxHP) * 100)}%` as any,
                            backgroundColor: dead ? '#ef4444' : isActive ? colors.primary : '#22c55e',
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={[styles.actions, { paddingBottom: botPad + 16, borderTopColor: colors.border }]}>
          {!autoMode && (
            <>
              <TouchableOpacity
                activeOpacity={busy ? 1 : 0.8}
                onPress={() => handleAction('ATTACK')}
                style={[
                  styles.actionBtn,
                  { backgroundColor: '#ef4444' + (busy ? '33' : '22'), borderColor: busy ? colors.border : '#ef4444' },
                ]}
              >
                <Feather name="crosshair" size={22} color={busy ? colors.mutedForeground : '#ef4444'} />
                <Text style={[styles.actionBtnLabel, { color: busy ? colors.mutedForeground : '#ef4444' }]}>Ataque</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={busy || !canSpirit ? 1 : 0.8}
                onPress={() => !busy && canSpirit && handleAction('SPIRIT')}
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: '#a855f7' + (!canSpirit || busy ? '11' : '22'),
                    borderColor: !canSpirit || busy ? colors.border : '#a855f7',
                  },
                ]}
              >
                <Feather name="star" size={22} color={!canSpirit || busy ? colors.mutedForeground : '#a855f7'} />
                <Text style={[styles.actionBtnLabel, { color: !canSpirit || busy ? colors.mutedForeground : '#a855f7' }]}>
                  Espírito ({SPIRIT_MP_COST} MP)
                </Text>
              </TouchableOpacity>
            </>
          )}
          {autoMode && (
            <View style={[styles.autoIndicator, { backgroundColor: '#22c55e11', borderColor: '#22c55e' }]}>
              <Feather name="zap" size={18} color="#22c55e" />
              <Text style={[styles.autoIndicatorText, { color: '#22c55e' }]}>Batalha Automática…</Text>
            </View>
          )}
          {(alreadyCleared || map.isDungeon) && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setAutoMode((p) => {
                  const n = !p;
                  if (n) setAutoRunCount(0);
                  return n;
                });
              }}
              style={[
                styles.autoBtn,
                {
                  backgroundColor: autoMode ? '#22c55e22' : colors.card,
                  borderColor: autoMode ? '#22c55e' : colors.border,
                },
              ]}
            >
              <Feather name={autoMode ? 'pause' : 'play'} size={16} color={autoMode ? '#22c55e' : colors.mutedForeground} />
              <Text style={[styles.autoBtnLabel, { color: autoMode ? '#22c55e' : colors.mutedForeground }]}>
                {autoMode ? 'Pausar Auto' : 'Auto'}
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
    const runsLeft = AUTO_RUN_MAX - autoRunCount;

    return (
      <View style={[styles.container, styles.resultCenter, { backgroundColor: colors.background }]}>
        <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: won ? '#22c55e' : '#ef4444' }]}>
          <Feather name={won ? 'award' : 'x-circle'} size={64} color={won ? '#22c55e' : '#ef4444'} />
          <Text style={[styles.resultTitle, { color: won ? '#22c55e' : '#ef4444' }]}>
            {won ? 'Vitória!' : 'Derrota'}
          </Text>
          {won && stage && (
            <View style={[styles.rewardBox, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}>
              <Feather name="award" size={16} color={colors.primary} />
              <Text style={[styles.rewardText, { color: colors.primary }]}>+{stage.expReward} EXP ganhos!</Text>
            </View>
          )}
          {won && (
            <View style={[styles.rewardBox, { backgroundColor: '#3b82f622', borderColor: '#3b82f6' }]}>
              <Feather name="cpu" size={16} color="#3b82f6" />
              <Text style={[styles.rewardText, { color: '#3b82f6' }]}>
                +5% scan de {CHARACTERS[stageQueue[0]]?.name ?? 'Digimon'}!
              </Text>
            </View>
          )}
          {autoRunning && (
            <View style={[styles.autoRestartBanner, { backgroundColor: '#22c55e11', borderColor: '#22c55e55' }]}>
              <Feather name="zap" size={14} color="#22c55e" />
              <Text style={[styles.autoRestartText, { color: '#22c55e' }]}>
                Reiniciando em 3s… ({autoRunCount}/{AUTO_RUN_MAX})
              </Text>
              <Text style={[styles.autoRestartSub, { color: '#22c55e99' }]}>
                {runsLeft} rodada{runsLeft !== 1 ? 's' : ''} restante{runsLeft !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
          {autoMode && won && autoRunCount >= AUTO_RUN_MAX && (
            <View style={[styles.autoRestartBanner, { backgroundColor: '#f59e0b11', borderColor: '#f59e0b55' }]}>
              <Feather name="check-circle" size={14} color="#f59e0b" />
              <Text style={[styles.autoRestartText, { color: '#f59e0b' }]}>
                Auto concluído! ({AUTO_RUN_MAX}/{AUTO_RUN_MAX})
              </Text>
            </View>
          )}
          {autoMode && won && (
            <TouchableOpacity
              onPress={() => { setAutoMode(false); setAutoRunCount(0); }}
              style={[styles.resultBtnOutline, { borderColor: '#ef4444' }]}
            >
              <Text style={[styles.resultBtnText, { color: '#ef4444' }]}>Cancelar Auto</Text>
            </TouchableOpacity>
          )}
          {!autoMode && (
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)/map')}
              style={[styles.resultBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.resultBtnText, { color: colors.primaryForeground }]}>Voltar ao Mapa</Text>
            </TouchableOpacity>
          )}
          {!won && (
            <TouchableOpacity
              onPress={() => { setPhase('select'); setLog([]); setWinner(null); }}
              style={[styles.resultBtnOutline, { borderColor: colors.border }]}
            >
              <Text style={[styles.resultBtnText, { color: colors.foreground }]}>Tentar Novamente</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontWeight: '700' as const },
  backBtn: { padding: 4 },
  errorText: { textAlign: 'center', fontSize: 16, margin: 40 },

  // ── Select ──
  enemyPreviewCard: {
    margin: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  previewBg: { width: '100%', height: 160 },
  previewBgOverlay: {
    flex: 1,
    minHeight: 120,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    gap: 6,
  },
  previewLabel: { fontSize: 10, fontWeight: '800' as const, letterSpacing: 1.5, color: '#ffffffcc' },
  previewEnemyRow: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
  previewSprite: { width: 100, height: 100 },
  previewInfo: { alignItems: 'center', gap: 8, padding: 14, width: '100%' },
  enemyNameLg: { fontSize: 18, fontWeight: '800' as const, textAlign: 'center' },
  enemyLevel: { fontSize: 14, fontWeight: '700' as const },
  expBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  expBadgeText: { fontSize: 13, fontWeight: '700' as const },
  chooseLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  selectList: { paddingHorizontal: 20, paddingBottom: 20, gap: 12 },
  selectCard: {
    width: 120,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    position: 'relative' as const,
  },
  teamPosBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamPosBadgeText: { fontSize: 11, fontWeight: '800' as const, color: '#fff' },
  selectName: { fontSize: 14, fontWeight: '700' as const },
  selectLevel: { fontSize: 12, fontWeight: '600' as const },
  startBattleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 16,
  },
  startBattleBtnText: { fontSize: 15, fontWeight: '800' as const },

  // ── Battle header ──
  battleHeader: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  battleTitle: { fontSize: 16, fontWeight: '700' as const },
  enemyCountBadge: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3 },
  enemyCountText: { fontSize: 12, fontWeight: '800' as const, color: '#ef4444' },

  // ── Fighters ──
  fighterRow: { padding: 20, gap: 10 },
  enemySide: { paddingBottom: 0 },
  playerSide: { paddingTop: 0 },
  fighterInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fighterName: { fontSize: 18, fontWeight: '700' as const },
  fighterLevel: { fontSize: 13 },
  mpRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  mpText: { fontSize: 12, fontWeight: '600' as const },

  // ── Team strip ──
  teamStrip: { flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' as const },
  teamChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 5,
  },
  teamChipHpTrack: { width: 56, height: 5, borderRadius: 3, overflow: 'hidden' as const },
  teamChipHpFill: { height: 5, borderRadius: 3 },

  // ── Log ──
  logBox: { flex: 1, marginHorizontal: 20, borderRadius: 12, borderWidth: 1, maxHeight: 130 },
  logContent: { padding: 12, gap: 4 },
  logEntry: { fontSize: 12, lineHeight: 18 },

  // ── Actions ──
  actions: { flexDirection: 'row', gap: 12, padding: 16, paddingTop: 12, borderTopWidth: 1 },
  actionBtn: { flex: 1, borderRadius: 14, borderWidth: 1.5, padding: 16, alignItems: 'center', gap: 6 },
  actionBtnLabel: { fontSize: 13, fontWeight: '700' as const },
  autoIndicator: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
  },
  autoIndicatorText: { fontSize: 14, fontWeight: '700' as const },
  autoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  autoBtnLabel: { fontSize: 12, fontWeight: '700' as const },

  // ── Arena ──
  arena: { width: '100%', height: 210 },
  arenaImage: { resizeMode: 'cover' as const },
  arenaOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
  },
  arenaTopRow: { flexDirection: 'row', alignItems: 'flex-start' },
  arenaNameBadge: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  arenaEnemyName: { fontSize: 16, fontWeight: '800' as const, color: '#ffffff' },
  arenaEnemyLevel: { fontSize: 11, color: '#ffffffaa', fontWeight: '600' as const },
  arenaSpriteWrapper: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  arenaSprite: { width: 120, height: 120 },
  arenaHpRow: { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, padding: 8 },

  // ── Result ──
  resultCenter: { alignItems: 'center', justifyContent: 'center' },
  resultCard: {
    width: '80%',
    borderRadius: 20,
    borderWidth: 2,
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  resultTitle: { fontSize: 32, fontWeight: '900' as const },
  rewardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  rewardText: { fontSize: 14, fontWeight: '700' as const },
  resultBtn: { width: '100%', borderRadius: 12, padding: 16, alignItems: 'center' },
  resultBtnOutline: { width: '100%', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1 },
  resultBtnText: { fontSize: 15, fontWeight: '700' as const },
  autoRestartBanner: { width: '100%', borderRadius: 12, borderWidth: 1, padding: 12, alignItems: 'center', gap: 4 },
  autoRestartText: { fontSize: 13, fontWeight: '700' as const },
  autoRestartSub: { fontSize: 11 },
});
