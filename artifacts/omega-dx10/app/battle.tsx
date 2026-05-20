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
  SCANNABLE_CHARACTERS,
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
import { HPBar, AttributeBadge, ElementBadge, CharacterAvatar } from '@/components/GameComponents';

type Phase = 'select' | 'battle' | 'result';
type BattleLog = { text: string; color: string };

export default function BattleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mapId: string; stageIndex: string }>();
  const { collection, selectedCharacter, setSelectedCharacter, gainExp, clearStage, isStageCleared, gainScan, equippedItems, gainPiece, gainBits, gainTamerExp } = useGame();

  const mapId = params.mapId ?? '';
  const stageIndex = Number(params.stageIndex ?? '0');
  const map = GAME_MAPS.find((m) => m.id === mapId);
  const stage = map?.stages[stageIndex];
  const alreadyCleared = isStageCleared(mapId, stageIndex);

  const [phase, setPhase] = useState<Phase>('select');
  const [playerFighter, setPlayerFighter] = useState<BattleFighter | null>(null);
  const [enemyFighter, setEnemyFighter] = useState<BattleFighter | null>(null);
  const [log, setLog] = useState<BattleLog[]>([]);
  const [winner, setWinner] = useState<'player' | 'enemy' | null>(null);
  const [busy, setBusy] = useState(false);

  const playerShake = useRef(new Animated.Value(0)).current;
  const enemyShake = useRef(new Animated.Value(0)).current;
  const logRef = useRef<ScrollView>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const shake = useCallback((anim: Animated.Value) => {
    Animated.sequence([
      Animated.timing(anim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, []);

  function addLog(text: string, color: string = colors.foreground) {
    setLog((prev) => [...prev, { text, color }]);
    setTimeout(() => logRef.current?.scrollToEnd({ animated: true }), 100);
  }

  function startBattle(ownedId: string) {
    const owned = collection.find((c) => c.ownedId === ownedId);
    if (!owned || !stage) return;
    setSelectedCharacter(ownedId);

    const pChar = CHARACTERS[owned.characterId];
    const eChar = CHARACTERS[stage.enemyCharacterId];
    if (!pChar || !eChar) return;

    const equipBonuses: EquipBonuses = { flat: {} };
    EQUIP_SLOTS_ORDER.forEach((slot) => {
      const itemId = equippedItems[slot];
      if (!itemId) return;
      const item = EQUIPMENT_ITEMS.find((i) => i.id === itemId);
      if (!item) return;
      Object.entries(item.bonuses).forEach(([k, v]) => {
        (equipBonuses.flat as Record<string, number>)[k] = ((equipBonuses.flat as Record<string, number>)[k] ?? 0) + (v ?? 0);
      });
      if (item.elementBonus) {
        if (!equipBonuses.elementBonuses) equipBonuses.elementBonuses = [];
        equipBonuses.elementBonuses.push(item.elementBonus);
      }
      if (item.percentBonuses) {
        if (!equipBonuses.percentBonuses) equipBonuses.percentBonuses = {};
        Object.entries(item.percentBonuses).forEach(([k, v]) => {
          if (v !== undefined) {
            (equipBonuses.percentBonuses as Record<string, number>)[k] = ((equipBonuses.percentBonuses as Record<string, number>)[k] ?? 0) + v;
          }
        });
      }
    });

    const pFighter = buildFighter(pChar.name, pChar.attribute, pChar.element, pChar.baseStats, owned.level, equipBonuses);
    const eFighter = buildFighter(eChar.name, eChar.attribute, eChar.element, eChar.baseStats, stage.enemyLevel);

    setPlayerFighter(pFighter);
    setEnemyFighter(eFighter);
    setLog([]);
    setWinner(null);
    setPhase('battle');

    const first = whoGoesFirst(pFighter, eFighter);
    addLog(
      first === 'player'
        ? `${pChar.name} age primeiro!`
        : `${eChar.name} age primeiro!`,
      colors.primary,
    );

    if (first === 'enemy') {
      setTimeout(() => doEnemyTurn(pFighter, eFighter), 800);
    }
  }

  function doEnemyTurn(pF: BattleFighter, eF: BattleFighter) {
    if (!eF || !pF) return;
    const action = enemyChooseAction(eF);
    const result = executeTurn(eF, pF, action);

    const newEnemyMP = result.attackerResult.newMP;
    const newPlayerHP = result.defenderResult.newHP;
    const logColor = result.defenderResult.attrMult > 1 || result.defenderResult.elemMult > 1 ? '#ef4444' : colors.foreground;
    addLog(result.defenderResult.log, logColor);
    shake(playerShake);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setEnemyFighter((prev) => prev ? { ...prev, currentMP: newEnemyMP } : prev);
    setPlayerFighter((prev) => prev ? { ...prev, currentHP: newPlayerHP } : prev);

    if (newPlayerHP <= 0) {
      setTimeout(() => {
        addLog('Você foi derrotado!', '#ef4444');
        setWinner('enemy');
        setPhase('result');
      }, 400);
    }
  }

  function handleAction(action: ActionType) {
    if (busy || !playerFighter || !enemyFighter || phase !== 'battle') return;
    if (action === 'SPIRIT' && playerFighter.currentMP < SPIRIT_MP_COST) return;

    setBusy(true);

    // Player turn
    const pResult = executeTurn(playerFighter, enemyFighter, action);
    const newPlayerMP = pResult.attackerResult.newMP;
    const newEnemyHP = pResult.defenderResult.newHP;
    const logColor = pResult.defenderResult.attrMult > 1 || pResult.defenderResult.elemMult > 1 ? '#22c55e' : colors.foreground;
    addLog(pResult.defenderResult.log, logColor);
    shake(enemyShake);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const updatedPlayer: BattleFighter = { ...playerFighter, currentMP: newPlayerMP };
    const updatedEnemy: BattleFighter = { ...enemyFighter, currentHP: newEnemyHP };
    setPlayerFighter(updatedPlayer);
    setEnemyFighter(updatedEnemy);

    if (newEnemyHP <= 0) {
      setTimeout(() => {
        addLog('Inimigo derrotado! Vitória!', '#22c55e');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setWinner('player');
        setPhase('result');
        // Grant rewards
        if (selectedCharacter) {
          gainExp(selectedCharacter.ownedId, stage?.expReward ?? 0);
        }
        clearStage(mapId, stageIndex);
        if (stage && SCANNABLE_CHARACTERS.includes(stage.enemyCharacterId)) {
          gainScan(stage.enemyCharacterId, 5);
        }

        if (map?.bitsReward) {
          gainBits(map.bitsReward);
          addLog(`💰 +${map.bitsReward.toLocaleString()} Bits!`, '#facc15');
        }
        if (map?.tamerExpReward) {
          gainTamerExp(map.tamerExpReward);
          addLog(`⭐ +${map.tamerExpReward} XP Tamer!`, '#a78bfa');
        }

        if (stage?.drops) {
          stage.drops.forEach((drop) => {
            if (Math.random() < drop.chance) {
              if (drop.type === 'bits') {
                gainBits(drop.amount);
                addLog(`💰 +${drop.amount.toLocaleString()} Bits!`, '#facc15');
              } else if (drop.type === 'piece' && drop.id) {
                gainPiece(drop.id, drop.amount);
                addLog(`✦ Fragmento obtido!`, '#f59e0b');
              }
            }
          });
        } else if (Math.random() < 0.30) {
          if (mapId === 'map_forest') {
            gainPiece('piece_coragem', 1);
            addLog('🔴 Fragmento da Coragem obtido!', '#ef4444');
          } else if (mapId === 'map_city') {
            gainPiece('piece_gelo', 1);
            addLog('🔵 Fragmento de Gelo obtido!', '#38bdf8');
          } else if (mapId === 'map_shadow') {
            gainPiece('piece_caos', 1);
            addLog('🟣 Fragmento do Caos obtido!', '#a855f7');
          }
        }
        // Universal sewing material drops (independent 20% each, any stage)
        if (Math.random() < 0.20) {
          gainPiece('piece_tecido', 1);
          addLog('🎨 Tecido Colorido obtido!', '#ec4899');
        }
        if (Math.random() < 0.20) {
          gainPiece('piece_agulha', 1);
          addLog('🪡 Agulha Média obtida!', '#8b5cf6');
        }
        if (Math.random() < 0.20) {
          gainPiece('piece_linha', 1);
          addLog('🧵 Linha Colorida obtida!', '#06b6d4');
        }
      }, 400);
      setBusy(false);
      return;
    }

    // Enemy turn after delay
    setTimeout(() => {
      doEnemyTurn(updatedPlayer, updatedEnemy);
      setBusy(false);
    }, 900);
  }

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

  const enemyChar = CHARACTERS[stage.enemyCharacterId];
  const enemyAttrData = enemyChar ? ATTRIBUTES[enemyChar.attribute] : null;

  // ── Select Phase ──────────────────────────────────────────────────────────────
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
        {enemyChar && (
          <View style={[styles.enemyPreviewCard, { borderColor: enemyAttrData ? enemyAttrData.color + '88' : colors.border, overflow: 'hidden' }]}>
            {map?.backgroundImage ? (
              <ImageBackground source={map.backgroundImage} style={styles.previewBg} imageStyle={{ resizeMode: 'cover' }}>
                <View style={styles.previewBgOverlay}>
                  <Text style={styles.previewLabel}>INIMIGO</Text>
                  {CHARACTER_IMAGES[stage.enemyCharacterId] ? (
                    <Image source={CHARACTER_IMAGES[stage.enemyCharacterId]} style={styles.previewSprite} resizeMode="contain" />
                  ) : (
                    <CharacterAvatar characterId={stage.enemyCharacterId} size={90} />
                  )}
                </View>
              </ImageBackground>
            ) : (
              <>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Inimigo</Text>
                <CharacterAvatar characterId={stage.enemyCharacterId} size={90} />
              </>
            )}
            <View style={[styles.previewInfo, { backgroundColor: colors.card }]}>
              <Text style={[styles.enemyNameLg, { color: colors.foreground }]}>{enemyChar.name}</Text>
              <Text style={[styles.enemyLevel, { color: colors.primary }]}>Nível {stage.enemyLevel}</Text>
              <View style={styles.enemyBadges}>
                <AttributeBadge attr={enemyChar.attribute} />
                <View style={{ width: 8 }} />
                <ElementBadge elem={enemyChar.element} />
              </View>
              <View style={[styles.expBadge, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}>
                <Feather name="award" size={12} color={colors.primary} />
                <Text style={[styles.expBadgeText, { color: colors.primary }]}>+{stage.expReward} EXP</Text>
              </View>
            </View>
          </View>
        )}

        <Text style={[styles.chooseLabel, { color: colors.mutedForeground }]}>ESCOLHA SEU DIGIMON</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectList}>
          {collection.map((owned) => {
            const c = CHARACTERS[owned.characterId];
            const attr = c ? ATTRIBUTES[c.attribute] : null;
            const isSelected = selectedCharacter?.ownedId === owned.ownedId;
            return (
              <TouchableOpacity
                key={owned.ownedId}
                onPress={() => startBattle(owned.ownedId)}
                activeOpacity={0.8}
                style={[
                  styles.selectCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <CharacterAvatar characterId={owned.characterId} size={64} />
                <Text style={[styles.selectName, { color: colors.foreground }]}>{c?.name}</Text>
                <Text style={[styles.selectLevel, { color: colors.primary }]}>Lv {owned.level}</Text>
                <AttributeBadge attr={c?.attribute ?? 'NO'} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  // ── Battle Phase ──────────────────────────────────────────────────────────────
  if (phase === 'battle' && playerFighter && enemyFighter) {
    const pOwned = collection.find((c) => c.ownedId === selectedCharacter?.ownedId);
    const pChar = pOwned ? CHARACTERS[pOwned.characterId] : null;
    const pAttr = pChar ? ATTRIBUTES[pChar.attribute] : null;
    const canSpirit = playerFighter.currentMP >= SPIRIT_MP_COST;

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.battleHeader, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
          <Text style={[styles.battleTitle, { color: colors.foreground }]}>{stage.name}</Text>
        </View>

        {/* Enemy arena */}
        {map?.backgroundImage ? (
          <ImageBackground
            source={map.backgroundImage}
            style={styles.arena}
            imageStyle={styles.arenaImage}
          >
            <View style={styles.arenaOverlay}>
              {/* Name + level top-left */}
              <View style={styles.arenaTopRow}>
                <View style={styles.arenaNameBadge}>
                  <Text style={styles.arenaEnemyName}>{enemyFighter.name}</Text>
                  <Text style={styles.arenaEnemyLevel}>Lv {stage.enemyLevel}</Text>
                </View>
              </View>
              {/* Enemy sprite */}
              <Animated.View style={[styles.arenaSpriteWrapper, { transform: [{ translateX: enemyShake }] }]}>
                {CHARACTER_IMAGES[stage.enemyCharacterId] ? (
                  <Image
                    source={CHARACTER_IMAGES[stage.enemyCharacterId]}
                    style={styles.arenaSprite}
                    resizeMode="contain"
                  />
                ) : (
                  <CharacterAvatar characterId={stage.enemyCharacterId} size={100} />
                )}
              </Animated.View>
              {/* HP bar bottom */}
              <View style={styles.arenaHpRow}>
                <HPBar current={enemyFighter.currentHP} max={getScaledStats(enemyChar?.baseStats ?? enemyFighter.stats, stage.enemyLevel).hp} color={enemyAttrData?.color ?? '#ef4444'} />
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
              <CharacterAvatar characterId={stage.enemyCharacterId} size={80} />
            </Animated.View>
            <HPBar current={enemyFighter.currentHP} max={getScaledStats(enemyChar?.baseStats ?? enemyFighter.stats, stage.enemyLevel).hp} color={enemyAttrData?.color ?? colors.primary} />
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
            <Text key={i} style={[styles.logEntry, { color: entry.color }]}>
              {entry.text}
            </Text>
          ))}
        </ScrollView>

        {/* Player */}
        <View style={[styles.fighterRow, styles.playerSide]}>
          <HPBar current={playerFighter.currentHP} max={getScaledStats(pChar?.baseStats ?? playerFighter.stats, pOwned?.level ?? 1).hp} color={colors.primary} />
          <View style={styles.mpRow}>
            <Text style={[styles.mpText, { color: '#a855f7' }]}>MP: {playerFighter.currentMP}/{playerFighter.stats.mp}</Text>
          </View>
          <View style={styles.fighterInfo}>
            <Text style={[styles.fighterName, { color: colors.foreground }]}>{playerFighter.name}</Text>
            <Text style={[styles.fighterLevel, { color: colors.mutedForeground }]}>Lv {pOwned?.level ?? 1}</Text>
          </View>
          <Animated.View style={{ transform: [{ translateX: playerShake }] }}>
            <CharacterAvatar characterId={pOwned?.characterId ?? ''} size={80} />
          </Animated.View>
        </View>

        {/* Actions */}
        <View style={[styles.actions, { paddingBottom: botPad + 16, borderTopColor: colors.border }]}>
          <TouchableOpacity
            activeOpacity={busy ? 1 : 0.8}
            onPress={() => handleAction('ATTACK')}
            style={[styles.actionBtn, { backgroundColor: '#ef4444' + (busy ? '33' : '22'), borderColor: busy ? colors.border : '#ef4444' }]}
          >
            <Feather name="crosshair" size={22} color={busy ? colors.mutedForeground : '#ef4444'} />
            <Text style={[styles.actionBtnLabel, { color: busy ? colors.mutedForeground : '#ef4444' }]}>Ataque</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={busy || !canSpirit ? 1 : 0.8}
            onPress={() => !busy && canSpirit && handleAction('SPIRIT')}
            style={[styles.actionBtn, { backgroundColor: '#a855f7' + (!canSpirit || busy ? '11' : '22'), borderColor: !canSpirit || busy ? colors.border : '#a855f7' }]}
          >
            <Feather name="star" size={22} color={!canSpirit || busy ? colors.mutedForeground : '#a855f7'} />
            <Text style={[styles.actionBtnLabel, { color: !canSpirit || busy ? colors.mutedForeground : '#a855f7' }]}>
              Espírito ({SPIRIT_MP_COST} MP)
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Result Phase ──────────────────────────────────────────────────────────────
  if (phase === 'result') {
    const won = winner === 'player';
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
          {won && stage && (
            <View style={[styles.rewardBox, { backgroundColor: '#3b82f622', borderColor: '#3b82f6' }]}>
              <Feather name="cpu" size={16} color="#3b82f6" />
              <Text style={[styles.rewardText, { color: '#3b82f6' }]}>
                +5% scan de {CHARACTERS[stage.enemyCharacterId]?.name ?? 'Digimon'}!
              </Text>
            </View>
          )}
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/map')}
            style={[styles.resultBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.resultBtnText, { color: colors.primaryForeground }]}>Voltar ao Mapa</Text>
          </TouchableOpacity>
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
  enemyPreviewCard: {
    margin: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  sectionLabel: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 1, textTransform: 'uppercase' },
  enemyAvatarLg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enemyNameLg: { fontSize: 24, fontWeight: '800' as const },
  enemyLevel: { fontSize: 14, fontWeight: '700' as const },
  enemyBadges: { flexDirection: 'row' },
  expBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4 },
  expBadgeText: { fontSize: 13, fontWeight: '700' as const },
  chooseLabel: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 1, paddingHorizontal: 20, marginBottom: 10 },
  selectList: { paddingHorizontal: 20, paddingBottom: 20, gap: 12 },
  selectCard: {
    width: 120,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  selectAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectName: { fontSize: 14, fontWeight: '700' as const },
  selectLevel: { fontSize: 12, fontWeight: '600' as const },
  // Battle
  battleHeader: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  battleTitle: { fontSize: 16, fontWeight: '700' as const },
  fighterRow: { padding: 20, gap: 10 },
  enemySide: { paddingBottom: 0 },
  playerSide: { paddingTop: 0 },
  fighterInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fighterName: { fontSize: 18, fontWeight: '700' as const },
  fighterLevel: { fontSize: 13 },
  fighterAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  mpRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  mpText: { fontSize: 12, fontWeight: '600' as const },
  logBox: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 130,
  },
  logContent: { padding: 12, gap: 4 },
  logEntry: { fontSize: 12, lineHeight: 18 },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  actionBtnLabel: { fontSize: 13, fontWeight: '700' as const },
  // Result
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
  // Select preview with background
  previewBg: { width: '100%', height: 160 },
  previewBgOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    gap: 6,
  },
  previewLabel: { fontSize: 10, fontWeight: '800' as const, letterSpacing: 1.5, color: '#ffffffcc' },
  previewSprite: { width: 100, height: 100 },
  previewInfo: { alignItems: 'center', gap: 8, padding: 14 },
  // Arena
  arena: { width: '100%', height: 210 },
  arenaImage: { resizeMode: 'cover' },
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
});
