import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Modal, Pressable, Animated, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGame, OwnedCharacter } from '@/context/GameContext';
import {
  CHARACTERS, EVOLUTIONS, SCANNABLE_CHARACTERS, CODEX_ORDER,
  RARITY_COLORS, RARITY_LABELS,
} from '@/constants/gameData';
import { CharacterCard, ScanCard, LockedCard, CharacterAvatar, AttributeBadge, ElementBadge } from '@/components/GameComponents';

const DIGIVO_GIF = require('../../assets/images/digivolution.gif');
const OMEGAMON_GIF = require('../../assets/images/omegamon_digivolve.gif');

// Reverse map: evolvesTo → { fromName, requiredLevel }
const EVOLVES_FROM: Record<string, { fromName: string; requiredLevel: number }> = {};
Object.entries(EVOLUTIONS).forEach(([fromId, evo]) => {
  const fromChar = CHARACTERS[fromId];
  EVOLVES_FROM[evo.evolvesTo] = { fromName: fromChar?.name ?? fromId, requiredLevel: evo.requiredLevel };
});

type EvoPhase = 'flashing' | 'reveal' | 'done';

export default function CollectionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { collection, selectedCharacter, setSelectedCharacter, scanProgress, createFromScan, evolveDigimon } = useGame();

  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const DIGIBANK_LIMIT = 100;
  const ownedCount = collection.length;

  // Modal state
  const [modalOwned, setModalOwned] = useState<OwnedCharacter | null>(null);

  // Evolution animation state
  const [evoAnim, setEvoAnim] = useState<{ fromCharId: string; toCharId: string } | null>(null);
  const [evoPhase, setEvoPhase] = useState<EvoPhase>('flashing');
  const flashOpacity = useRef(new Animated.Value(1)).current;
  const newFormOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.7)).current;

  function openModal(owned: OwnedCharacter) {
    setSelectedCharacter(owned.ownedId);
    setModalOwned(owned);
  }

  function closeModal() {
    setModalOwned(null);
  }

  const handleEvolve = useCallback((ownedId: string, fromCharId: string, toCharId: string) => {
    closeModal();
    flashOpacity.setValue(1);
    newFormOpacity.setValue(0);
    titleScale.setValue(0.7);
    setEvoPhase('flashing');
    setEvoAnim({ fromCharId, toCharId });
    evolveDigimon(ownedId);
  }, [evolveDigimon]);

  // Drive the animation phases
  useEffect(() => {
    if (!evoAnim) return;

    if (evoPhase === 'flashing') {
      // Flash old form black ↔ visible × 5, then move to reveal
      const flashes = Array.from({ length: 5 }, () =>
        Animated.sequence([
          Animated.timing(flashOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
          Animated.timing(flashOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        ])
      );
      Animated.sequence(flashes).start(() => setEvoPhase('reveal'));
    }

    if (evoPhase === 'reveal') {
      Animated.parallel([
        Animated.timing(newFormOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(titleScale, { toValue: 1, useNativeDriver: true, friction: 5 }),
      ]).start(() => setEvoPhase('done'));
    }
  }, [evoAnim, evoPhase]);

  // Computed evolution info for modal
  const modalEvo = modalOwned ? EVOLUTIONS[modalOwned.characterId] : undefined;
  const modalCanEvolve = !!(modalOwned && modalEvo && modalOwned.level >= modalEvo.requiredLevel);
  const modalEvoChar = modalEvo ? CHARACTERS[modalEvo.evolvesTo] : undefined;

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
          const isScannable = CHARACTERS[charId]?.rarity === 'COMMON';
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
          {/* GIF background */}
          <Image
            source={evoAnim?.toCharId === 'omegamon' ? OMEGAMON_GIF : DIGIVO_GIF}
            style={styles.evoGifBg}
            resizeMode="cover"
          />
          <View style={styles.evoOverlayDim} />

          {/* Content */}
          <View style={styles.evoContent} pointerEvents="none">
            {evoPhase === 'flashing' && evoAnim && (
              <>
                <Text style={styles.evoTopLabel}>DIGIVOLUÇÃO!</Text>
                {/* Old form with black flash */}
                <View style={styles.evoAvatarWrap}>
                  <Animated.View style={{ opacity: flashOpacity }}>
                    <CharacterAvatar characterId={evoAnim.fromCharId} size={140} />
                  </Animated.View>
                  {/* Black silhouette overlay — visible when opacity flips to 0 */}
                  <Animated.View
                    style={[
                      styles.evoSilhouette,
                      { opacity: Animated.subtract(1, flashOpacity) },
                    ]}
                  />
                </View>
                <Text style={styles.evoFromName}>{fromChar?.name ?? ''}</Text>
              </>
            )}

            {(evoPhase === 'reveal' || evoPhase === 'done') && evoAnim && (
              <>
                <Animated.Text style={[styles.evoTopLabel, { transform: [{ scale: titleScale }] }]}>
                  DIGIVOLUÇÃO COMPLETA!
                </Animated.Text>
                <Animated.View style={[styles.evoAvatarWrap, { opacity: newFormOpacity }]}>
                  <CharacterAvatar characterId={evoAnim.toCharId} size={140} />
                </Animated.View>
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
});
