import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Modal, Pressable, Animated, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGame, OwnedCharacter, SacrificeResult } from '@/context/GameContext';
import {
  CHARACTERS, EVOLUTIONS, ALTERNATE_EVOLUTIONS, FORM_CHANGES, SCANNABLE_CHARACTERS, CODEX_ORDER,
  RARITY_COLORS, RARITY_LABELS,
  SACRIFICE_DROPS, ROOKIE_OF, SACRIFICE_SCAN_OVERRIDES, SACRIFICE_SCAN_PCT, ITEM_NAMES,
} from '@/constants/gameData';
import { CharacterCard, ScanCard, LockedCard, CharacterAvatar, AttributeBadge, ElementBadge } from '@/components/GameComponents';

const DIGIVO_GIF       = require('../../assets/images/digivolution.gif');
const DIGIVO_INTRO_GIF = require('../../assets/images/digivolution_intro.gif');
const OMEGAMON_GIF          = require('../../assets/images/omegamon_digivolve.gif');
const SHINEGREYMON_BM_GIF   = require('../../assets/images/characters/shinegreymonbm_special.gif');
const ROSEMON_BM_GIF        = require('../../assets/images/characters/rosemonBurstMode_status.gif');
const IMPERIALDRAMON_PM_GIF = require('../../assets/images/characters/imperialDramonPM_status.gif');

// Reverse map: evolvesTo → { fromName, requiredLevel }
const EVOLVES_FROM: Record<string, { fromName: string; requiredLevel: number }> = {};
Object.entries(EVOLUTIONS).forEach(([fromId, evo]) => {
  const fromChar = CHARACTERS[fromId];
  EVOLVES_FROM[evo.evolvesTo] = { fromName: fromChar?.name ?? fromId, requiredLevel: evo.requiredLevel };
});

type EvoPhase = 'playing' | 'reveal' | 'done';

export default function CollectionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { collection, selectedCharacter, setSelectedCharacter, scanProgress, createFromScan, evolveDigimon, changeFormDigimon, pieces, sacrificeDigimon, isAdmin } = useGame();

  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const DIGIBANK_LIMIT = isAdmin ? 500 : 100;
  const ownedCount = collection.length;

  // Modal state
  const [modalOwned, setModalOwned] = useState<OwnedCharacter | null>(null);
  const [confirmSacrificeVisible, setConfirmSacrificeVisible] = useState(false);
  const [sacrificeResult, setSacrificeResult] = useState<SacrificeResult | null>(null);

  // Evolution animation state
  const [evoAnim, setEvoAnim] = useState<{ fromCharId: string; toCharId: string } | null>(null);
  const [evoPhase, setEvoPhase] = useState<EvoPhase>('playing');
  const fromOpacity   = useRef(new Animated.Value(1)).current;
  const newFormOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.7)).current;

  function openModal(owned: OwnedCharacter) {
    setSelectedCharacter(owned.ownedId);
    setModalOwned(owned);
  }

  function closeModal() {
    setModalOwned(null);
  }

  const handleEvolve = useCallback((ownedId: string, fromCharId: string, toCharId: string, alternate?: boolean) => {
    closeModal();
    fromOpacity.setValue(1);
    newFormOpacity.setValue(0);
    titleScale.setValue(0.7);
    setEvoPhase('playing');
    setEvoAnim({ fromCharId, toCharId });
    evolveDigimon(ownedId, alternate);
  }, [evolveDigimon]);

  // Drive the animation phases
  useEffect(() => {
    if (!evoAnim) return;

    if (evoPhase === 'playing') {
      // Intro GIF is 5.20s — wait for it to finish, then crossfade forms
      const t = setTimeout(() => setEvoPhase('reveal'), 5200);
      return () => clearTimeout(t);
    }

    if (evoPhase === 'reveal') {
      Animated.parallel([
        Animated.timing(fromOpacity,    { toValue: 0, duration: 700, useNativeDriver: true }),
        Animated.timing(newFormOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(titleScale,     { toValue: 1, useNativeDriver: true, friction: 6 }),
      ]).start(() => setEvoPhase('done'));
    }
  }, [evoAnim, evoPhase]);

  // Computed evolution info for modal
  const modalEvo       = modalOwned ? EVOLUTIONS[modalOwned.characterId] : undefined;
  const hasReqItem     = !modalEvo?.requiredItem || (pieces[modalEvo.requiredItem] ?? 0) > 0;
  const modalCanEvolve = !!(modalOwned && modalEvo && modalOwned.level >= modalEvo.requiredLevel && hasReqItem);
  const modalEvoChar   = modalEvo ? CHARACTERS[modalEvo.evolvesTo] : undefined;

  const modalFormChangeId      = modalOwned ? (FORM_CHANGES[modalOwned.characterId] ?? null) : null;
  const modalFormChangeChar    = modalFormChangeId ? CHARACTERS[modalFormChangeId] : null;

  const modalAltEvo            = modalOwned ? ALTERNATE_EVOLUTIONS[modalOwned.characterId] : undefined;
  const hasAltReqItem          = !modalAltEvo?.requiredItem || (pieces[modalAltEvo.requiredItem] ?? 0) > 0;
  const altSacrificeCharId     = modalAltEvo?.requiredSacrificeCharacter;
  const altSacrificeChar       = altSacrificeCharId ? CHARACTERS[altSacrificeCharId] : undefined;
  const hasAltSacrifice        = !altSacrificeCharId || collection.some(
    (c) => c.ownedId !== modalOwned?.ownedId && c.characterId === altSacrificeCharId
  );
  const modalCanAltEvolve = !!(modalOwned && modalAltEvo && modalOwned.level >= modalAltEvo.requiredLevel && hasAltReqItem && hasAltSacrifice);
  const modalAltEvoChar   = modalAltEvo ? CHARACTERS[modalAltEvo.evolvesTo] : undefined;

  // Sacrifice info for current modal character
  const modalChar = modalOwned ? CHARACTERS[modalOwned.characterId] : null;
  const sacrificeDrops = modalOwned ? (SACRIFICE_DROPS[modalOwned.characterId] ?? []) : [];
  const sacrificeOverride = modalOwned ? SACRIFICE_SCAN_OVERRIDES[modalOwned.characterId] : undefined;
  const sacrificeRookieId = modalOwned ? (ROOKIE_OF[modalOwned.characterId] ?? null) : null;
  const sacrificeScanPct  = modalChar ? (SACRIFICE_SCAN_PCT[modalChar.rarity] ?? 0) : 0;
  const canSacrifice = !!(modalChar && modalChar.rarity !== 'COMMON');

  const toChar = evoAnim ? CHARACTERS[evoAnim.toCharId] : null;
  const fromChar = evoAnim ? CHARACTERS[evoAnim.fromCharId] : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: 16, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Digibank</Text>
        <View style={[styles.countBadge, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}>
          <Text style={[styles.countText, { color: colors.primary }]}>{ownedCount} / {DIGIBANK_LIMIT}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {CODEX_ORDER.map((charId) => {
          const owned = collection.find((c) => c.characterId === charId);
          const isScannable = SCANNABLE_CHARACTERS.includes(charId);
          const scan = scanProgress[charId] ?? 0;
          const evo = owned ? EVOLUTIONS[owned.characterId] : undefined;
          const canEvolve = !!(owned && evo && owned.level >= evo.requiredLevel);
          const evolvesFrom = EVOLVES_FROM[charId];

          if (owned) {
            return (
              <CharacterCard
                key={owned.ownedId}
                owned={owned}
                isSelected={selectedCharacter?.ownedId === owned.ownedId}
                canEvolve={canEvolve}
                onPress={() => openModal(owned)}
              />
            );
          }

          if (isScannable) {
            return (
              <ScanCard
                key={charId}
                characterId={charId}
                scanPct={scan}
                onCreate={() => createFromScan(charId)}
              />
            );
          }

          // Evolution-only entries are hidden — accessible via character detail screen
          return null;
        })}

        <View style={[styles.infoBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="cpu" size={16} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Vença batalhas para ganhar{' '}
            <Text style={{ color: colors.primary, fontWeight: '700' }}>+5% de scan</Text>
            {' '}do Digimon inimigo. Com 100% você pode criar um novo Digimon!
          </Text>
        </View>
      </ScrollView>

      {/* ── Evolution Modal ── */}
      <Modal
        visible={modalOwned !== null}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <Pressable
            style={[styles.modalSheet, { backgroundColor: colors.card }]}
            onPress={(e) => e.stopPropagation()}
          >
            {modalOwned && (() => {
              const char = CHARACTERS[modalOwned.characterId];
              const rarityColor = char ? RARITY_COLORS[char.rarity] : colors.primary;

              return (
                <>
                  {/* Handle bar */}
                  <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

                  {/* Title */}
                  <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                    {char?.name ?? modalOwned.characterId}
                  </Text>
                  <Text style={[styles.sheetSub, { color: colors.mutedForeground }]}>
                    Lv {modalOwned.level} · {char ? RARITY_LABELS[char.rarity] : ''}
                  </Text>

                  {/* Evolution section */}
                  {modalEvo && modalEvoChar ? (
                    <View style={[styles.evoSection, { borderColor: modalCanEvolve ? '#f59e0b' : colors.border }]}>
                      {/* From */}
                      <View style={styles.evoSide}>
                        <CharacterAvatar characterId={modalOwned.characterId} size={72} />
                        <Text style={[styles.evoName, { color: colors.foreground }]}>{char?.name}</Text>
                        <Text style={[styles.evoLevel, { color: colors.primary }]}>Lv {modalOwned.level}</Text>
                      </View>

                      {/* Arrow */}
                      <View style={styles.evoArrow}>
                        <Feather name="arrow-right" size={28} color={modalCanEvolve ? '#f59e0b' : colors.mutedForeground} />
                        <Text style={[styles.evoReqText, { color: modalCanEvolve ? '#f59e0b' : colors.mutedForeground }]}>
                          Lv {modalEvo.requiredLevel}
                        </Text>
                        {modalEvo.requiredItem && (
                          <Text style={[styles.evoReqText, { color: hasReqItem ? '#f59e0b' : '#ef4444', fontSize: 10, marginTop: 2 }]}>
                            {ITEM_NAMES[modalEvo.requiredItem] ?? modalEvo.requiredItem}{'\n'}
                            ({pieces[modalEvo.requiredItem] ?? 0} possuído{(pieces[modalEvo.requiredItem] ?? 0) !== 1 ? 's' : ''})
                          </Text>
                        )}
                      </View>

                      {/* To */}
                      <View style={styles.evoSide}>
                        <CharacterAvatar characterId={modalEvo.evolvesTo} size={72} />
                        <Text style={[styles.evoName, { color: colors.foreground }]}>{modalEvoChar.name}</Text>
                        <View style={styles.evoBadgesRow}>
                          <AttributeBadge attr={modalEvoChar.attribute} />
                          <ElementBadge elem={modalEvoChar.element} />
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View style={[styles.noEvoBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
                      <Feather name="check-circle" size={20} color={colors.mutedForeground} />
                      <Text style={[styles.noEvoText, { color: colors.mutedForeground }]}>
                        Este Digimon está na sua forma final.
                      </Text>
                    </View>
                  )}

                  {/* Evolve button */}
                  {modalEvo && (
                    modalCanEvolve ? (
                      <TouchableOpacity
                        style={[styles.evolveBtn, { backgroundColor: '#f59e0b' }]}
                        activeOpacity={0.85}
                        onPress={() => {
                          if (!modalOwned || !modalEvo) return;
                          handleEvolve(modalOwned.ownedId, modalOwned.characterId, modalEvo.evolvesTo);
                        }}
                      >
                        <Feather name="arrow-up-circle" size={20} color="#000" />
                        <Text style={styles.evolveBtnText}>Evoluir para {modalEvo.label}</Text>
                      </TouchableOpacity>
                    ) : !hasReqItem ? (
                      <View style={[styles.evolveLocked, { backgroundColor: colors.background, borderColor: '#ef444466' }]}>
                        <Feather name="package" size={16} color="#ef4444" />
                        <Text style={[styles.evolveLockedText, { color: '#ef4444' }]}>
                          Requer {ITEM_NAMES[modalEvo.requiredItem!] ?? modalEvo.requiredItem} para evoluir
                        </Text>
                      </View>
                    ) : (
                      <View style={[styles.evolveLocked, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <Feather name="lock" size={16} color={colors.mutedForeground} />
                        <Text style={[styles.evolveLockedText, { color: colors.mutedForeground }]}>
                          Alcance o Nível {modalEvo.requiredLevel} para evoluir
                          {' '}(faltam {modalEvo.requiredLevel - modalOwned.level} níveis)
                        </Text>
                      </View>
                    )
                  )}

                  {/* Alternate evolve button (e.g. Ophanimon via Anel Sagrado) */}
                  {modalAltEvo && modalAltEvoChar && (
                    <View style={[styles.evoSection, { borderColor: modalCanAltEvolve ? '#a855f7' : colors.border, marginTop: 4 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={styles.evoSide}>
                          <CharacterAvatar characterId={modalOwned!.characterId} size={56} />
                        </View>
                        <View style={styles.evoArrow}>
                          <Feather name="arrow-right" size={24} color={modalCanAltEvolve ? '#a855f7' : colors.mutedForeground} />
                          <Text style={[styles.evoReqText, { color: modalCanAltEvolve ? '#a855f7' : colors.mutedForeground }]}>
                            Lv {modalAltEvo.requiredLevel}
                          </Text>
                          {modalAltEvo.requiredItem && (
                            <Text style={[styles.evoReqText, { color: hasAltReqItem ? '#a855f7' : '#ef4444', fontSize: 10, marginTop: 2 }]}>
                              {ITEM_NAMES[modalAltEvo.requiredItem] ?? modalAltEvo.requiredItem}{'\n'}
                              ({pieces[modalAltEvo.requiredItem] ?? 0} possuído{(pieces[modalAltEvo.requiredItem] ?? 0) !== 1 ? 's' : ''})
                            </Text>
                          )}
                          {altSacrificeChar && (
                            <Text style={[styles.evoReqText, { color: hasAltSacrifice ? '#f59e0b' : '#ef4444', fontSize: 10, marginTop: 2, textAlign: 'center' }]}>
                              {'⚔️ Sacrificar\n'}{altSacrificeChar.name}{'\n'}
                              {hasAltSacrifice ? '✓ Disponível' : '✗ Não possui'}
                            </Text>
                          )}
                        </View>
                        <View style={styles.evoSide}>
                          <CharacterAvatar characterId={modalAltEvo.evolvesTo} size={56} />
                          <Text style={[styles.evoName, { color: colors.foreground }]}>{modalAltEvoChar.name}</Text>
                          <View style={styles.evoBadgesRow}>
                            <AttributeBadge attr={modalAltEvoChar.attribute} />
                            <ElementBadge elem={modalAltEvoChar.element} />
                          </View>
                        </View>
                      </View>
                      {modalCanAltEvolve ? (
                        <TouchableOpacity
                          style={[styles.evolveBtn, { backgroundColor: '#a855f7' }]}
                          activeOpacity={0.85}
                          onPress={() => {
                            if (!modalOwned || !modalAltEvo) return;
                            handleEvolve(modalOwned.ownedId, modalOwned.characterId, modalAltEvo.evolvesTo, true);
                          }}
                        >
                          <Feather name="arrow-up-circle" size={20} color="#fff" />
                          <Text style={[styles.evolveBtnText, { color: '#fff' }]}>Evoluir para {modalAltEvo.label}</Text>
                        </TouchableOpacity>
                      ) : !hasAltReqItem ? (
                        <View style={[styles.evolveLocked, { backgroundColor: colors.background, borderColor: '#ef444466' }]}>
                          <Feather name="package" size={16} color="#ef4444" />
                          <Text style={[styles.evolveLockedText, { color: '#ef4444' }]}>
                            Requer {ITEM_NAMES[modalAltEvo.requiredItem!] ?? modalAltEvo.requiredItem} para evoluir
                          </Text>
                        </View>
                      ) : !hasAltSacrifice ? (
                        <View style={[styles.evolveLocked, { backgroundColor: colors.background, borderColor: '#ef444466' }]}>
                          <Feather name="alert-triangle" size={16} color="#ef4444" />
                          <Text style={[styles.evolveLockedText, { color: '#ef4444' }]}>
                            Requer {altSacrificeChar?.name ?? altSacrificeCharId} na coleção para sacrificar
                          </Text>
                        </View>
                      ) : (
                        <View style={[styles.evolveLocked, { backgroundColor: colors.background, borderColor: colors.border }]}>
                          <Feather name="lock" size={16} color={colors.mutedForeground} />
                          <Text style={[styles.evolveLockedText, { color: colors.mutedForeground }]}>
                            Alcance o Nível {modalAltEvo.requiredLevel} para evoluir
                            {' '}(faltam {modalAltEvo.requiredLevel - modalOwned!.level} níveis)
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Form Change section (e.g. ImperialDramon FM ↔ RM) */}
                  {modalFormChangeId && modalFormChangeChar && (
                    <View style={[styles.evoSection, { borderColor: '#06b6d4', marginTop: 4 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={styles.evoSide}>
                          <CharacterAvatar characterId={modalOwned!.characterId} size={56} />
                          <Text style={[styles.evoName, { color: colors.foreground, fontSize: 10 }]}>Atual</Text>
                        </View>
                        <View style={styles.evoArrow}>
                          <Feather name="refresh-cw" size={22} color="#06b6d4" />
                          <Text style={[styles.evoReqText, { color: '#06b6d4', fontSize: 10, marginTop: 2 }]}>Livre</Text>
                        </View>
                        <View style={styles.evoSide}>
                          <CharacterAvatar characterId={modalFormChangeId} size={56} />
                          <Text style={[styles.evoName, { color: colors.foreground }]}>{modalFormChangeChar.name}</Text>
                          <View style={styles.evoBadgesRow}>
                            <AttributeBadge attr={modalFormChangeChar.attribute} />
                            <ElementBadge elem={modalFormChangeChar.element} />
                          </View>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[styles.evolveBtn, { backgroundColor: '#06b6d4' }]}
                        activeOpacity={0.85}
                        onPress={() => {
                          if (!modalOwned) return;
                          changeFormDigimon(modalOwned.ownedId);
                          closeModal();
                        }}
                      >
                        <Feather name="refresh-cw" size={18} color="#000" />
                        <Text style={[styles.evolveBtnText, { color: '#000' }]}>Mudar para {modalFormChangeChar.name}</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Sacrifice section */}
                  {canSacrifice && (
                    <View style={[styles.sacrificeSection, { borderColor: '#ef444433', backgroundColor: '#ef444408' }]}>
                      <View style={styles.sacrificeHeader}>
                        <Feather name="zap-off" size={13} color="#ef4444" />
                        <Text style={[styles.sacrificeTitle, { color: '#ef4444' }]}>Sacrifício</Text>
                      </View>
                      <Text style={[styles.sacrificeDesc, { color: colors.mutedForeground }]}>
                        {sacrificeOverride
                          ? `+${Math.round(sacrificeOverride.percent * 100)}% scan de ${CHARACTERS[sacrificeOverride.characterId]?.name ?? sacrificeOverride.characterId}`
                          : sacrificeRookieId
                            ? `+${Math.round(sacrificeScanPct * 100)}% scan de ${CHARACTERS[sacrificeRookieId]?.name ?? sacrificeRookieId}`
                            : 'Sem bônus de scan'}
                        {sacrificeDrops.length > 0 && ` · ${Math.round(sacrificeDrops[0].chance * 100)}% de chance: ${ITEM_NAMES[sacrificeDrops[0].itemId] ?? sacrificeDrops[0].itemId}`}
                      </Text>
                      <TouchableOpacity
                        style={[styles.sacrificeBtn, { borderColor: '#ef4444' }]}
                        activeOpacity={0.8}
                        onPress={() => setConfirmSacrificeVisible(true)}
                      >
                        <Feather name="trash-2" size={14} color="#ef4444" />
                        <Text style={[styles.sacrificeBtnText, { color: '#ef4444' }]}>Sacrificar</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Detail & close buttons */}
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.detailBtn, { borderColor: colors.border }]}
                      onPress={() => {
                        closeModal();
                        router.push(`/character/${modalOwned.ownedId}`);
                      }}
                    >
                      <Feather name="info" size={16} color={colors.foreground} />
                      <Text style={[styles.detailBtnText, { color: colors.foreground }]}>Ver detalhes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.closeBtn, { borderColor: colors.border }]}
                      onPress={closeModal}
                    >
                      <Text style={[styles.closeBtnText, { color: colors.mutedForeground }]}>Fechar</Text>
                    </TouchableOpacity>
                  </View>
                </>
              );
            })()}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Digivolution Animation Overlay ── */}
      <Modal
        visible={evoAnim !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => { if (evoPhase === 'done') setEvoAnim(null); }}
      >
        <Pressable
          style={styles.evoOverlay}
          onPress={() => { if (evoPhase === 'done') setEvoAnim(null); }}
        >
          {/* GIF background — intro during 'playing', reveal GIF after */}
          <Image
            source={
              evoPhase === 'playing'
                ? (evoAnim?.toCharId === 'omegamon' ? OMEGAMON_GIF : evoAnim?.toCharId === 'shineGreymonBurstMode' ? SHINEGREYMON_BM_GIF : evoAnim?.toCharId === 'rosemonBurstMode' ? ROSEMON_BM_GIF : evoAnim?.toCharId === 'imperialDramonPM' ? IMPERIALDRAMON_PM_GIF : DIGIVO_INTRO_GIF)
                : (evoAnim?.toCharId === 'omegamon' ? OMEGAMON_GIF : evoAnim?.toCharId === 'shineGreymonBurstMode' ? SHINEGREYMON_BM_GIF : evoAnim?.toCharId === 'rosemonBurstMode' ? ROSEMON_BM_GIF : evoAnim?.toCharId === 'imperialDramonPM' ? IMPERIALDRAMON_PM_GIF : DIGIVO_GIF)
            }
            style={styles.evoGifBg}
            resizeMode="cover"
          />
          <View style={styles.evoOverlayDim} />

          {/* Content */}
          <View style={styles.evoContent} pointerEvents="none">
            {(evoPhase === 'reveal' || evoPhase === 'done') && evoAnim && (
              <>
                {/* Crossfade: old form fades out, new form fades in */}
                <View style={styles.evoAvatarWrap}>
                  <Animated.View style={[StyleSheet.absoluteFill, { opacity: fromOpacity, alignItems: 'center', justifyContent: 'center' }]}>
                    <CharacterAvatar characterId={evoAnim.fromCharId} size={140} />
                  </Animated.View>
                  <Animated.View style={{ opacity: newFormOpacity }}>
                    <CharacterAvatar characterId={evoAnim.toCharId} size={140} />
                  </Animated.View>
                </View>
                <Animated.Text style={[styles.evoToName, { opacity: newFormOpacity }]}>
                  {toChar?.name ?? ''}
                </Animated.Text>
                {toChar && (
                  <Animated.View style={[styles.evoBadgesRowBig, { opacity: newFormOpacity }]}>
                    <AttributeBadge attr={toChar.attribute} />
                    <ElementBadge elem={toChar.element} />
                  </Animated.View>
                )}
                {evoPhase === 'done' && (
                  <Text style={styles.evoDismiss}>Toque para continuar</Text>
                )}
              </>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* ── Sacrifice Confirm Modal ───────────────────────────────────── */}
      <Modal visible={confirmSacrificeVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmSheet, { backgroundColor: colors.card }]}>
            <Text style={[styles.confirmTitle, { color: '#ef4444' }]}>Sacrificar Digimon?</Text>
            <Text style={[styles.confirmBody, { color: colors.mutedForeground }]}>
              <Text style={{ fontWeight: '700', color: colors.foreground }}>
                {modalChar?.name}
              </Text>
              {' '}será removido permanentemente da sua DigiBank.{'\n\n'}
              Possíveis recompensas:{'\n'}
              {sacrificeOverride
                ? `• +${Math.round(sacrificeOverride.percent * 100)}% scan de ${CHARACTERS[sacrificeOverride.characterId]?.name}`
                : sacrificeRookieId
                  ? `• +${Math.round(sacrificeScanPct * 100)}% scan de ${CHARACTERS[sacrificeRookieId]?.name ?? sacrificeRookieId}`
                  : '• Sem bônus de scan'}
              {sacrificeDrops.length > 0
                ? `\n• ${Math.round(sacrificeDrops[0].chance * 100)}% de ${ITEM_NAMES[sacrificeDrops[0].itemId] ?? sacrificeDrops[0].itemId}`
                : ''}
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmCancelBtn, { borderColor: colors.border }]}
                onPress={() => setConfirmSacrificeVisible(false)}
              >
                <Text style={[styles.confirmCancelText, { color: colors.mutedForeground }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmSacrificeBtn}
                onPress={() => {
                  if (!modalOwned) return;
                  const result = sacrificeDigimon(modalOwned.ownedId);
                  setConfirmSacrificeVisible(false);
                  setSacrificeResult(result);
                  setModalOwned(null);
                }}
              >
                <Feather name="trash-2" size={15} color="#fff" />
                <Text style={styles.confirmSacrificeText}>Confirmar Sacrifício</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Sacrifice Result Modal ────────────────────────────────────── */}
      <Modal visible={!!sacrificeResult} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmSheet, { backgroundColor: colors.card }]}>
            <Text style={[styles.confirmTitle, { color: colors.foreground }]}>Resultado do Sacrifício</Text>
            {sacrificeResult?.scanGained && (
              <View style={styles.resultRow}>
                <Feather name="search" size={16} color={colors.primary} />
                <Text style={[styles.resultText, { color: colors.foreground }]}>
                  +{sacrificeResult.scanGained.amount}% scan de{' '}
                  <Text style={{ fontWeight: '700' }}>
                    {CHARACTERS[sacrificeResult.scanGained.characterId]?.name ?? sacrificeResult.scanGained.characterId}
                  </Text>
                </Text>
              </View>
            )}
            {sacrificeResult?.droppedItem && (
              <View style={styles.resultRow}>
                <Feather name="package" size={16} color="#f59e0b" />
                <Text style={[styles.resultText, { color: colors.foreground }]}>
                  Obteve:{' '}
                  <Text style={{ fontWeight: '700', color: '#f59e0b' }}>
                    {ITEM_NAMES[sacrificeResult.droppedItem] ?? sacrificeResult.droppedItem}
                  </Text>
                </Text>
              </View>
            )}
            {!sacrificeResult?.scanGained && !sacrificeResult?.droppedItem && (
              <Text style={[styles.confirmBody, { color: colors.mutedForeground }]}>
                Nenhuma recompensa desta vez.
              </Text>
            )}
            <TouchableOpacity
              style={[styles.confirmSacrificeBtn, { backgroundColor: colors.primary }]}
              onPress={() => setSacrificeResult(null)}
            >
              <Text style={styles.confirmSacrificeText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 28, fontWeight: '800' as const },
  countBadge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4 },
  countText: { fontSize: 13, fontWeight: '700' as const },
  list: { paddingHorizontal: 20, paddingTop: 16 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginTop: 4,
  },
  infoText: { fontSize: 13, flex: 1, lineHeight: 18 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000066',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    gap: 14,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
  sheetTitle: { fontSize: 22, fontWeight: '800' as const, textAlign: 'center' },
  sheetSub: { fontSize: 13, textAlign: 'center', marginTop: -8 },

  // Evolution display
  evoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 8,
  },
  evoSide: { alignItems: 'center', gap: 4, flex: 1 },
  evoName: { fontSize: 13, fontWeight: '700' as const, textAlign: 'center' },
  evoLevel: { fontSize: 12, fontWeight: '600' as const },
  evoArrow: { alignItems: 'center', gap: 2 },
  evoReqText: { fontSize: 10, fontWeight: '700' as const },
  evoBadgesRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', justifyContent: 'center' },

  noEvoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  noEvoText: { fontSize: 13, flex: 1 },

  evolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
  },
  evolveBtnText: { fontSize: 15, fontWeight: '800' as const, color: '#000' },
  evolveLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  evolveLockedText: { fontSize: 12, flex: 1 },

  modalActions: { flexDirection: 'row', gap: 10 },
  detailBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
  },
  detailBtnText: { fontSize: 13, fontWeight: '700' as const },
  closeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
  },
  closeBtnText: { fontSize: 13, fontWeight: '600' as const },

  // ── Digivolution overlay ──────────────────────────────────────────────────
  evoOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  evoGifBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.55,
  },
  evoOverlayDim: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    opacity: 0.35,
  },
  evoContent: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  evoTopLabel: {
    fontSize: 26,
    fontWeight: '900' as const,
    color: '#f59e0b',
    textAlign: 'center',
    letterSpacing: 1.5,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  evoAvatarWrap: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  evoSilhouette: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#000',
  },
  evoFromName: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  evoToName: {
    fontSize: 26,
    fontWeight: '900' as const,
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    textAlign: 'center',
  },
  evoBadgesRowBig: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  evoDismiss: {
    fontSize: 13,
    color: '#ffffff88',
    marginTop: 8,
  },

  // ── Sacrifice section ─────────────────────────────────────────────────────
  sacrificeSection: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  sacrificeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sacrificeTitle: {
    fontSize: 13,
    fontWeight: '800' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  sacrificeDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  sacrificeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 9,
    marginTop: 2,
  },
  sacrificeBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },

  // ── Confirm & result sheets ───────────────────────────────────────────────
  confirmSheet: {
    margin: 24,
    borderRadius: 20,
    padding: 22,
    gap: 14,
    alignSelf: 'center' as const,
    width: '88%',
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    textAlign: 'center' as const,
  },
  confirmBody: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center' as const,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  confirmCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
  },
  confirmCancelText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  confirmSacrificeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    paddingVertical: 12,
  },
  confirmSacrificeText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#fff',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  resultText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});
