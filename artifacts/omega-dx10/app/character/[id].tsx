import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Modal, Pressable, Animated, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import {
  CHARACTERS, ATTRIBUTES, ELEMENTS,
  RARITY_COLORS, RARITY_LABELS,
  getScaledStats, expToNextLevel,
  FUSIONS,
} from '@/constants/gameData';
import { AttributeBadge, ElementBadge, StatBar, CharacterAvatar } from '@/components/GameComponents';

const DIGIVO_GIF             = require('../../assets/images/digivolution.gif');
const FUSION_GIF             = require('../../assets/images/fusion_crimson.gif');
const OMEGAMON_GIF              = require('../../assets/images/omegamon_digivolve.gif');
const OMEGAMON_FUSION_INTRO     = require('../../assets/images/omegamon_fusion_intro.gif');
const SHINEGREYMON_BM_GIF       = require('../../assets/images/characters/shinegreymonbm_special.gif');
const ROSEMON_BM_GIF            = require('../../assets/images/characters/rosemonBurstMode_status.gif');
const IMPERIALDRAMON_PM_GIF     = require('../../assets/images/characters/imperialDramonPM_status.gif');

type FusePhase = 'playing' | 'reveal' | 'done';

export default function CharacterDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { collection, selectedCharacter, setSelectedCharacter, fuseDigimon } = useGame();

  const [confirmFuseVisible, setConfirmFuseVisible] = useState(false);
  const [fuseSacrificeId, setFuseSacrificeId] = useState<string | null>(null);

  // ── Fusion animation ────────────────────────────────────────────────────────
  const [fuseAnim, setFuseAnim] = useState<{ fromCharId: string; toCharId: string } | null>(null);
  const [fusePhase, setFusePhase] = useState<FusePhase>('playing');
  const flashOpacity  = useRef(new Animated.Value(1)).current;
  const newFormOpacity = useRef(new Animated.Value(0)).current;
  const titleScale    = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    if (!fuseAnim) return;
    if (fusePhase === 'playing') {
      // Intro GIF is 8.37s — wait for it to finish, then reveal
      const t = setTimeout(() => setFusePhase('reveal'), 8400);
      return () => clearTimeout(t);
    }
    if (fusePhase === 'reveal') {
      Animated.parallel([
        Animated.timing(newFormOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(titleScale,     { toValue: 1, useNativeDriver: true, friction: 5 }),
      ]).start(() => setFusePhase('done'));
    }
  }, [fuseAnim, fusePhase]);

  const owned = collection.find((c) => c.ownedId === id);
  const char  = owned ? CHARACTERS[owned.characterId] : null;

  if (!owned || !char) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.destructive }]}>Digimon não encontrado</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.primary, textAlign: 'center' }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const scaled   = getScaledStats(char.baseStats, owned.level);
  const isMaxLevel = owned.level >= 100;
  const expNeeded = isMaxLevel ? 1 : expToNextLevel(owned.level);
  const expPct   = isMaxLevel ? 1 : Math.min(1, owned.exp / expNeeded);
  const rarityColor = RARITY_COLORS[char.rarity];
  const attrData = ATTRIBUTES[char.attribute];
  const elemData = ELEMENTS[char.element];
  const isSelected = selectedCharacter?.ownedId === owned.ownedId;

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  // ── Fusion info ─────────────────────────────────────────────────────────────
  const fusionRecipe  = FUSIONS[owned.characterId] ?? null;
  const partnerOwned  = fusionRecipe ? collection.find((c) => c.characterId === fusionRecipe.partner) ?? null : null;
  const resultChar    = fusionRecipe ? CHARACTERS[fusionRecipe.resultId]  : null;
  const partnerChar   = fusionRecipe ? CHARACTERS[fusionRecipe.partner]   : null;
  const meetsLevel    = !!(fusionRecipe && owned.level >= fusionRecipe.requiredLevel);
  const canFuse       = !!(fusionRecipe && partnerOwned && meetsLevel);

  function handleFusePress() {
    if (!partnerOwned) return;
    setFuseSacrificeId(partnerOwned.ownedId);
    setConfirmFuseVisible(true);
  }

  function handleFuseConfirm() {
    if (!fuseSacrificeId || !owned || !fusionRecipe) return;
    setConfirmFuseVisible(false);
    fuseDigimon(owned.ownedId, fuseSacrificeId);
    // Start animation
    newFormOpacity.setValue(0);
    titleScale.setValue(0.7);
    setFusePhase('playing');
    setFuseAnim({ fromCharId: owned.characterId, toCharId: fusionRecipe.resultId });
  }

  // ── Element background pulse ────────────────────────────────────────────────
  const elemPulse = useRef(new Animated.Value(0.08)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(elemPulse, { toValue: 0.22, duration: 2200, useNativeDriver: true }),
        Animated.timing(elemPulse, { toValue: 0.08, duration: 2200, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [elemPulse]);

  // GIF to show: intro during 'playing', reveal GIF during 'reveal'/'done'
  const animGif =
    fusePhase === 'playing'
      ? (fuseAnim?.toCharId === 'omegamon' ? OMEGAMON_FUSION_INTRO : FUSION_GIF)
      : (fuseAnim?.toCharId === 'omegamon' ? OMEGAMON_GIF           : FUSION_GIF);
  const fuseToChar   = fuseAnim ? CHARACTERS[fuseAnim.toCharId]   : null;
  const fuseFromChar = fuseAnim ? CHARACTERS[fuseAnim.fromCharId] : null;

  const isOmegamon           = char.id === 'omegamon';
  const isShineGreymonBM     = char.id === 'shineGreymonBurstMode';
  const isRoseMonBM          = char.id === 'rosemonBurstMode';
  const isImperialDramonPM   = char.id === 'imperialDramonPM';
  const hasSpecialGif        = isOmegamon || isShineGreymonBM || isRoseMonBM || isImperialDramonPM;
  const specialGif           = isOmegamon ? OMEGAMON_GIF : isShineGreymonBM ? SHINEGREYMON_BM_GIF : isRoseMonBM ? ROSEMON_BM_GIF : IMPERIALDRAMON_PM_GIF;

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {hasSpecialGif ? (
          <Image
            source={specialGif}
            style={styles.omegamonBgGif}
            resizeMode="cover"
          />
        ) : (
          <>
            <Animated.View style={[styles.elemBgOverlay, { backgroundColor: elemData.color, opacity: elemPulse }]} />
            <Text style={[styles.elemBgLabel, { color: elemData.color }]}>{elemData.label.toUpperCase()}</Text>
          </>
        )}
      <ScrollView
        style={[styles.scrollView, styles.scrollTransparent]}
        contentContainerStyle={[styles.content, { paddingTop: topPad + 8, paddingBottom: 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.primary} />
        </TouchableOpacity>

        {/* Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: elemData.color + '66' }]}>
          <View style={[styles.heroStrip, { backgroundColor: elemData.color + '18' }]}>
            {hasSpecialGif ? (
              <Image
                source={specialGif}
                style={styles.heroStripGif}
                resizeMode="cover"
              />
            ) : (
              <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: elemData.color, opacity: elemPulse }]} />
            )}
            <CharacterAvatar characterId={char.id} size={120} />
          </View>
          <View style={styles.heroInfo}>
            <Text style={[styles.heroName, { color: colors.foreground }]}>{char.name}</Text>
            <Text style={[styles.heroRarity, { color: rarityColor }]}>{RARITY_LABELS[char.rarity]}</Text>
            <View style={styles.heroBadges}>
              <AttributeBadge attr={char.attribute} />
              <View style={{ width: 8 }} />
              <ElementBadge elem={char.element} />
            </View>
            <Text style={[styles.heroDesc, { color: colors.mutedForeground }]}>{char.description}</Text>
          </View>
        </View>

        {/* Level & EXP */}
        <View style={[styles.levelCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.levelRow}>
            <Text style={[styles.levelLabel, { color: colors.mutedForeground }]}>NÍVEL</Text>
            <Text style={[styles.levelNum, { color: colors.primary }]}>{owned.level}</Text>
          </View>
          <View style={styles.expBlock}>
            <View style={styles.expHeader}>
              <Text style={[styles.expLabel, { color: colors.mutedForeground }]}>EXP</Text>
              {isMaxLevel
                ? <Text style={[styles.expValue, { color: colors.primary, fontWeight: 'bold' }]}>MAX</Text>
                : <Text style={[styles.expValue, { color: colors.foreground }]}>{owned.exp} / {expNeeded}</Text>
              }
            </View>
            <View style={[styles.expTrack, { backgroundColor: colors.border }]}>
              <View style={[styles.expFill, { width: `${expPct * 100}%` as any, backgroundColor: isMaxLevel ? '#f59e0b' : colors.primary }]} />
            </View>
            {!isMaxLevel && (
              <Text style={[styles.expNext, { color: colors.mutedForeground }]}>
                {expNeeded - owned.exp} EXP para Nível {owned.level + 1}
              </Text>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Atributos</Text>
          <StatBar label="HP"  value={scaled.hp}  max={400} color="#22c55e" />
          <StatBar label="MP"  value={scaled.mp}  max={400} color="#00d4ff" />
          <StatBar label="ATK" value={scaled.atk} max={250} color="#ef4444" />
          <StatBar label="DEF" value={scaled.def} max={250} color="#3b82f6" />
          <StatBar label="SPT" value={scaled.spt} max={250} color="#a855f7" />
          <StatBar label="SPD" value={scaled.spd} max={250} color="#facc15" />
          <StatBar label="APT" value={scaled.apt} max={100} color="#f97316" />
        </View>

        {/* ── Fusion section ─────────────────────────────────────────────────── */}
        {fusionRecipe && resultChar && partnerChar && (
          <View style={[styles.fusionCard, {
            backgroundColor: colors.card,
            borderColor: canFuse ? '#ff3c6e88' : colors.border,
          }]}>
            <View style={styles.fusionHeader}>
              <Feather name="git-merge" size={16} color={canFuse ? '#ff3c6e' : colors.mutedForeground} />
              <Text style={[styles.fusionTitle, { color: canFuse ? '#ff3c6e' : colors.foreground }]}>
                Fusão — {resultChar.name}
              </Text>
              <View style={[styles.ultraPill, { backgroundColor: '#ff3c6e22', borderColor: '#ff3c6e66' }]}>
                <Text style={styles.ultraPillText}>ULTRA</Text>
              </View>
            </View>

            {/* Diagram */}
            <View style={styles.fusionRow}>
              <View style={styles.fusionSide}>
                <CharacterAvatar characterId={owned.characterId} size={64} />
                <Text style={[styles.fusionName, { color: colors.foreground }]}>{char.name}</Text>
                <Text style={[styles.fusionSub, { color: colors.primary }]}>Lv {owned.level}</Text>
              </View>
              <View style={styles.fusionCenter}>
                <Feather name="plus" size={20} color={canFuse ? '#ff3c6e' : colors.mutedForeground} />
                <Text style={[styles.fusionArrow, { color: canFuse ? '#ff3c6e' : colors.mutedForeground }]}>→</Text>
              </View>
              <View style={styles.fusionSide}>
                <CharacterAvatar characterId={fusionRecipe.partner} size={64} dimmed={!canFuse} />
                <Text style={[styles.fusionName, { color: canFuse ? colors.foreground : colors.mutedForeground }]}>
                  {partnerChar.name}
                </Text>
                <Text style={[styles.fusionSub, { color: canFuse ? colors.primary : colors.mutedForeground }]}>
                  {canFuse ? `Lv ${partnerOwned!.level}` : 'Não obtido'}
                </Text>
              </View>
              <View style={styles.fusionCenter}>
                <Feather name="chevrons-right" size={20} color={canFuse ? '#ff3c6e' : colors.mutedForeground} />
              </View>
              <View style={styles.fusionSide}>
                <CharacterAvatar characterId={fusionRecipe.resultId} size={64} />
                <Text style={[styles.fusionName, { color: canFuse ? '#ff3c6e' : colors.mutedForeground }]}>
                  {resultChar.name}
                </Text>
              </View>
            </View>

            {canFuse ? (
              <TouchableOpacity
                style={[styles.fuseBtn, { backgroundColor: '#ff3c6e' }]}
                activeOpacity={0.85}
                onPress={handleFusePress}
              >
                <Feather name="git-merge" size={18} color="#fff" />
                <Text style={styles.fuseBtnText}>Fundir em {resultChar.name}</Text>
              </TouchableOpacity>
            ) : !meetsLevel ? (
              <View style={[styles.fuseLocked, { backgroundColor: colors.background, borderColor: '#f59e0b66' }]}>
                <Feather name="trending-up" size={14} color="#f59e0b" />
                <Text style={[styles.fuseLockedText, { color: '#f59e0b' }]}>
                  Alcance o Nível {fusionRecipe.requiredLevel} com este Digimon para fundir
                  {' '}(faltam {fusionRecipe.requiredLevel - owned.level} níveis)
                </Text>
              </View>
            ) : (
              <View style={[styles.fuseLocked, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Feather name="lock" size={14} color={colors.mutedForeground} />
                <Text style={[styles.fuseLockedText, { color: colors.mutedForeground }]}>
                  Obtenha {partnerChar.name} para realizar a fusão
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Attribute advantages */}
        <View style={[styles.advCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Vantagens de Atributo</Text>
          <View style={styles.advRow}>
            <View style={[styles.advTag, { backgroundColor: '#22c55e22', borderColor: '#22c55e' }]}>
              <Feather name="chevrons-up" size={14} color="#22c55e" />
              <Text style={[styles.advText, { color: '#22c55e' }]}>
                {attrData.beats ? `Eficaz vs ${ATTRIBUTES[attrData.beats].label} (${attrData.beats})` : 'Sem vantagem'}
              </Text>
            </View>
            <View style={[styles.advTag, { backgroundColor: '#ef444422', borderColor: '#ef4444' }]}>
              <Feather name="chevrons-down" size={14} color="#ef4444" />
              <Text style={[styles.advText, { color: '#ef4444' }]}>
                {attrData.weakTo ? `Fraco vs ${ATTRIBUTES[attrData.weakTo].label} (${attrData.weakTo})` : 'Sem fraqueza'}
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 16 }]}>Vantagens de Elemento</Text>
          <View style={styles.advRow}>
            <View style={[styles.advTag, { backgroundColor: elemData.color + '22', borderColor: elemData.color }]}>
              <Feather name="chevrons-up" size={14} color={elemData.color} />
              <Text style={[styles.advText, { color: elemData.color }]}>
                {elemData.beats ? `Eficaz vs ${ELEMENTS[elemData.beats].label}` : 'Sem vantagem'}
              </Text>
            </View>
            <View style={[styles.advTag, { backgroundColor: '#ef444422', borderColor: '#ef4444' }]}>
              <Feather name="chevrons-down" size={14} color="#ef4444" />
              <Text style={[styles.advText, { color: '#ef4444' }]}>
                {elemData.weakTo ? `Fraco vs ${ELEMENTS[elemData.weakTo].label}` : 'Sem fraqueza'}
              </Text>
            </View>
          </View>
        </View>

        {/* Select button */}
        <TouchableOpacity
          onPress={() => { setSelectedCharacter(owned.ownedId); router.back(); }}
          activeOpacity={0.8}
          style={[
            styles.selectBtn,
            {
              backgroundColor: isSelected ? '#22c55e22' : colors.primary,
              borderColor: isSelected ? '#22c55e' : 'transparent',
              borderWidth: isSelected ? 1.5 : 0,
            },
          ]}
        >
          <Feather name={isSelected ? 'check-circle' : 'zap'} size={18} color={isSelected ? '#22c55e' : colors.primaryForeground} />
          <Text style={[styles.selectBtnText, { color: isSelected ? '#22c55e' : colors.primaryForeground }]}>
            {isSelected ? 'Digimon Ativo' : 'Selecionar para Batalha'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      </View>

      {/* ── Fusion confirmation modal ────────────────────────────────────── */}
      <Modal
        visible={confirmFuseVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmFuseVisible(false)}
      >
        <Pressable style={styles.confirmOverlay} onPress={() => setConfirmFuseVisible(false)}>
          <Pressable
            style={[styles.confirmBox, { backgroundColor: colors.card, borderColor: '#ff3c6e88' }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Feather name="alert-triangle" size={28} color="#ff3c6e" style={{ alignSelf: 'center' }} />
            <Text style={[styles.confirmTitle, { color: colors.foreground }]}>Confirmar Fusão</Text>
            <Text style={[styles.confirmBody, { color: colors.mutedForeground }]}>
              {partnerChar?.name} será{' '}
              <Text style={{ color: '#ff3c6e', fontWeight: '700' }}>sacrificado permanentemente</Text>
              {' '}para criar o{' '}
              <Text style={{ color: '#ff3c6e', fontWeight: '700' }}>{resultChar?.name}</Text>.
              {'\n\n'}Esta ação não pode ser desfeita.
            </Text>
            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={[styles.confirmCancel, { borderColor: colors.border }]}
                onPress={() => setConfirmFuseVisible(false)}
              >
                <Text style={[styles.confirmCancelText, { color: colors.mutedForeground }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmFuse} onPress={handleFuseConfirm}>
                <Feather name="git-merge" size={16} color="#fff" />
                <Text style={styles.confirmFuseText}>Fundir!</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Fusion animation overlay ─────────────────────────────────────── */}
      <Modal
        visible={fuseAnim !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => { if (fusePhase === 'done') { setFuseAnim(null); router.back(); } }}
      >
        <Pressable
          style={styles.evoOverlay}
          onPress={() => { if (fusePhase === 'done') { setFuseAnim(null); router.back(); } }}
        >
          <Image source={animGif} style={styles.evoGifBg} resizeMode="cover" />
          <View style={styles.evoOverlayDim} />

          <View style={styles.evoContent} pointerEvents="none">
            {(fusePhase === 'reveal' || fusePhase === 'done') && fuseAnim && (
              <>
                <Animated.Text style={[styles.evoTopLabel, styles.evoTopLabelFusion, { transform: [{ scale: titleScale }] }]}>
                </Animated.Text>
                <Animated.View style={[styles.evoAvatarWrap, { opacity: newFormOpacity }]}>
                  <CharacterAvatar characterId={fuseAnim.toCharId} size={140} />
                </Animated.View>
                <Animated.Text style={[styles.evoToName, { opacity: newFormOpacity }]}>
                  {fuseToChar?.name ?? ''}
                </Animated.Text>
                {fuseToChar && (
                  <Animated.View style={[styles.evoBadgesRowBig, { opacity: newFormOpacity }]}>
                    <AttributeBadge attr={fuseToChar.attribute} />
                    <ElementBadge   elem={fuseToChar.element}   />
                  </Animated.View>
                )}
                {fusePhase === 'done' && (
                  <Text style={styles.evoDismiss}>Toque para continuar</Text>
                )}
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  elemBgOverlay: {
    ...StyleSheet.absoluteFillObject as any,
    zIndex: 0,
  },
  elemBgLabel: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    fontSize: 96,
    fontWeight: '900' as const,
    opacity: 0.07,
    letterSpacing: 8,
    zIndex: 0,
    pointerEvents: 'none' as any,
  },
  omegamonBgGif: {
    ...StyleSheet.absoluteFillObject as any,
    width: '100%', height: '100%',
    opacity: 0.18,
    zIndex: 0,
  },
  scrollView: { flex: 1 },
  scrollTransparent: { backgroundColor: 'transparent' },
  content: { paddingHorizontal: 20 },
  backBtn: { marginBottom: 16, alignSelf: 'flex-start', padding: 4 },
  errorText: { textAlign: 'center', fontSize: 16, margin: 40 },
  heroCard: { borderRadius: 20, borderWidth: 1.5, overflow: 'hidden', marginBottom: 16 },
  heroStrip: { alignItems: 'center', paddingTop: 24, paddingBottom: 16, overflow: 'hidden' as const },
  heroStripGif: {
    ...StyleSheet.absoluteFillObject as any,
    width: '100%', height: '100%',
    opacity: 0.35,
  },
  heroInfo: { padding: 20, gap: 8 },
  heroName: { fontSize: 28, fontWeight: '800' as const },
  heroRarity: { fontSize: 13, fontWeight: '700' as const },
  heroBadges: { flexDirection: 'row' },
  heroDesc: { fontSize: 13, lineHeight: 20 },
  levelCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  levelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  levelLabel: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 1 },
  levelNum: { fontSize: 36, fontWeight: '900' as const },
  expBlock: { gap: 6 },
  expHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  expLabel: { fontSize: 11, fontWeight: '600' as const },
  expValue: { fontSize: 11 },
  expTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  expFill: { height: '100%', borderRadius: 4 },
  expNext: { fontSize: 11, textAlign: 'right' },
  statsCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },

  // ── Fusion ──────────────────────────────────────────────────────────────────
  fusionCard: { borderRadius: 16, borderWidth: 1.5, padding: 16, marginBottom: 16, gap: 14 },
  fusionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fusionTitle: { fontSize: 14, fontWeight: '800' as const, flex: 1 },
  ultraPill: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  ultraPillText: { fontSize: 10, fontWeight: '800' as const, color: '#ff3c6e' },
  fusionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fusionSide: { alignItems: 'center', gap: 4, flex: 1 },
  fusionName: { fontSize: 11, fontWeight: '700' as const, textAlign: 'center' },
  fusionSub: { fontSize: 10, fontWeight: '600' as const },
  fusionCenter: { alignItems: 'center', gap: 2 },
  fusionArrow: { fontSize: 16, fontWeight: '900' as const },
  fuseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 14, paddingVertical: 14,
  },
  fuseBtnText: { fontSize: 15, fontWeight: '800' as const, color: '#fff' },
  fuseLocked: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, borderWidth: 1, padding: 12,
  },
  fuseLockedText: { fontSize: 12, flex: 1 },

  advCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700' as const, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 },
  advRow: { gap: 8 },
  advTag: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, padding: 10 },
  advText: { fontSize: 13, fontWeight: '600' as const },
  selectBtn: { borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  selectBtnText: { fontSize: 16, fontWeight: '700' as const },

  // ── Confirm modal ────────────────────────────────────────────────────────────
  confirmOverlay: {
    flex: 1, backgroundColor: '#00000088',
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  confirmBox: { borderRadius: 20, borderWidth: 1.5, padding: 24, gap: 14, width: '100%' },
  confirmTitle: { fontSize: 20, fontWeight: '800' as const, textAlign: 'center' },
  confirmBody: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  confirmBtnRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  confirmCancel: { flex: 1, borderRadius: 12, borderWidth: 1.5, paddingVertical: 13, alignItems: 'center' },
  confirmCancelText: { fontSize: 14, fontWeight: '700' as const },
  confirmFuse: {
    flex: 1, borderRadius: 12, backgroundColor: '#ff3c6e',
    paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  confirmFuseText: { fontSize: 14, fontWeight: '800' as const, color: '#fff' },

  // ── Fusion animation ─────────────────────────────────────────────────────────
  evoOverlay: {
    flex: 1, backgroundColor: '#000',
    alignItems: 'center', justifyContent: 'center',
  },
  evoGifBg: {
    ...StyleSheet.absoluteFillObject as any,
    width: '100%', height: '100%', opacity: 0.65,
  },
  evoOverlayDim: {
    ...StyleSheet.absoluteFillObject as any,
    backgroundColor: '#00000055',
  },
  evoContent: {
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 16,
  },
  evoTopLabel: {
    fontSize: 26, fontWeight: '900' as const,
    color: '#facc15',
    textShadowColor: '#000', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8,
    letterSpacing: 2, textAlign: 'center',
  },
  evoTopLabelFusion: { color: '#ff3c6e' },
  evoAvatarWrap: { position: 'relative' as const, width: 140, height: 140 },
  evoSilhouette: {
    ...StyleSheet.absoluteFillObject as any,
    backgroundColor: '#000', borderRadius: 70,
  },
  evoFromName: {
    fontSize: 18, fontWeight: '700' as const, color: '#fff',
    textShadowColor: '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
  },
  evoToName: {
    fontSize: 22, fontWeight: '900' as const, color: '#fff',
    textShadowColor: '#000', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8,
  },
  evoBadgesRowBig: { flexDirection: 'row', gap: 10 },
  evoDismiss: {
    fontSize: 13, color: 'rgba(255,255,255,0.6)',
    marginTop: 8, textAlign: 'center',
  },
});
