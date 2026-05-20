import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import {
  CRAFT_RECIPES, RARITY_COLORS, RARITY_LABELS,
} from '@/constants/gameData';
import EQUIP_ITEM_IMAGES from '@/constants/equipImages';

const PIECE_META = [
  { id: 'piece_coragem',          label: 'Coragem',             icon: 'zap',     color: '#ef4444' },
  { id: 'piece_brasao_coragem',   label: 'Coragem Piece',       icon: 'sun',     color: '#f97316', itemId: 'brasao_coragem' },
  { id: 'piece_brasao_esperanca', label: 'Esperança Piece',     icon: 'sun',     color: '#eab308', itemId: 'brasao_esperanca' },
  { id: 'piece_brasao_amizade',   label: 'Amizade Piece',       icon: 'users',   color: '#3b82f6', itemId: 'brasao_amizade' },
  { id: 'piece_caos',             label: 'Caos',                icon: 'cpu',     color: '#a855f7' },
  { id: 'piece_tecido',           label: 'Tecido',              icon: 'layers',  color: '#ec4899' },
  { id: 'piece_agulha',           label: 'Agulha',              icon: 'edit-2',  color: '#8b5cf6' },
  { id: 'piece_linha',            label: 'Linha',               icon: 'wind',    color: '#06b6d4' },
  { id: 'piece_brasao_confianca', label: 'Confiança Piece',     icon: 'shield',  color: '#94a3b8', itemId: 'brasao_confianca' },
  { id: 'piece_brasao_pureza',    label: 'Pureza Piece',        icon: 'droplet', color: '#22c55e', itemId: 'brasao_pureza' },
  { id: 'piece_brasao_amor',      label: 'Amor Piece',          icon: 'heart',   color: '#f43f5e', itemId: 'brasao_amor' },
  { id: 'piece_brasao_luz',       label: 'Luz Piece',           icon: 'star',    color: '#c084fc', itemId: 'brasao_luz' },
  { id: 'piece_brasao_conhecimento', label: 'Conhecimento Piece', icon: 'book',  color: '#a855f7', itemId: 'brasao_conhecimento' },
];

export default function CraftScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { pieces, bits, inventory, craftItem } = useGame();

  const topPad = 0;
  const botPad = insets.bottom + 20;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 20, paddingBottom: botPad }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Fragmentos ── */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Fragmentos</Text>
      <View style={[styles.fragmentSummaryRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {PIECE_META.map((p) => {
          const img = (p as any).itemId ? EQUIP_ITEM_IMAGES[(p as any).itemId] : null;
          return (
            <View key={p.id} style={styles.fragmentSummaryItem}>
              <View style={[styles.fragmentSummaryIcon, { backgroundColor: p.color + '22' }]}>
                {img ? (
                  <>
                    <Image source={img} style={{ width: 24, height: 24 }} resizeMode="contain" />
                    <View style={styles.puzzleOverlay}>
                      <Text style={styles.puzzleEmoji}>🧩</Text>
                    </View>
                  </>
                ) : (
                  <Feather name={p.icon as any} size={16} color={p.color} />
                )}
              </View>
              <Text style={[styles.fragmentSummaryCount, { color: colors.foreground }]}>{pieces[p.id] ?? 0}</Text>
              <Text style={[styles.fragmentSummaryLabel, { color: colors.mutedForeground }]}>{p.label}</Text>
            </View>
          );
        })}
      </View>

      {/* ── Receitas ── */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Receitas</Text>

      {CRAFT_RECIPES.map((recipe, idx) => {
        const isMulti = !!(recipe.pieceRequirements && recipe.pieceRequirements.length > 0);
        const alreadyCrafted = inventory.includes(recipe.resultItemId);
        const hasEnoughBits = bits >= (recipe.bitsCost ?? 0);

        let hasEnoughPieces: boolean;
        let progress: number;
        let singleCount = 0;

        if (isMulti) {
          hasEnoughPieces = recipe.pieceRequirements!.every((r) => (pieces[r.pieceId] ?? 0) >= r.count);
          progress = Math.min(...recipe.pieceRequirements!.map((r) => Math.min(1, (pieces[r.pieceId] ?? 0) / r.count)));
        } else {
          singleCount = pieces[recipe.pieceId] ?? 0;
          hasEnoughPieces = singleCount >= recipe.requiredCount;
          progress = Math.min(1, singleCount / recipe.requiredCount);
        }

        const canCraft = hasEnoughPieces && hasEnoughBits && !alreadyCrafted;
        const rarityColor = RARITY_COLORS[recipe.resultRarity];
        const rarityLabel = RARITY_LABELS[recipe.resultRarity];

        let btnLabel: string;
        if (canCraft) {
          btnLabel = `Forjar ${recipe.resultItemName}`;
        } else if (!hasEnoughPieces) {
          btnLabel = isMulti ? 'Faltam materiais' : `Faltam ${recipe.requiredCount - singleCount} fragmentos`;
        } else {
          btnLabel = `Faltam ${((recipe.bitsCost ?? 0) - bits).toLocaleString()} Bits`;
        }

        return (
          <View
            key={`${recipe.resultItemId}-${idx}`}
            style={[styles.craftCard, { backgroundColor: colors.card, borderColor: alreadyCrafted ? '#22c55e66' : canCraft ? rarityColor + '88' : colors.border }]}
          >
            {/* Header */}
            <View style={styles.craftCardHeader}>
              {EQUIP_ITEM_IMAGES[recipe.resultItemId] ? (
                <View style={[styles.craftPieceIcon, { backgroundColor: rarityColor + '18' }]}>
                  <Image
                    source={EQUIP_ITEM_IMAGES[recipe.resultItemId]}
                    style={styles.craftItemImg}
                    resizeMode="contain"
                  />
                </View>
              ) : (
                <View style={[styles.craftPieceIcon, { backgroundColor: recipe.pieceColor + '22' }]}>
                  <Feather name={recipe.pieceIcon as any} size={18} color={recipe.pieceColor} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.craftResultName, { color: colors.foreground }]}>{recipe.resultItemName}</Text>
                <View style={styles.craftRarityRow}>
                  <View style={[styles.craftRarityBadge, { backgroundColor: rarityColor + '22' }]}>
                    <Text style={[styles.craftRarityText, { color: rarityColor }]}>{rarityLabel}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Requirements */}
            <View style={styles.craftReqRow}>
              {isMulti ? (
                recipe.pieceRequirements!.map((req) => {
                  const cnt = pieces[req.pieceId] ?? 0;
                  const met = cnt >= req.count;
                  return (
                    <View key={req.pieceId} style={[styles.craftReqChip, {
                      backgroundColor: met ? req.pieceColor + '18' : colors.background,
                      borderColor: met ? req.pieceColor : colors.border,
                    }]}>
                      <Feather name={req.pieceIcon as any} size={12} color={met ? req.pieceColor : colors.mutedForeground} />
                      <Text style={[styles.craftReqText, { color: met ? req.pieceColor : colors.mutedForeground }]}>
                        {cnt}/{req.count} {req.pieceName.split(' ')[0]}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <View style={[styles.craftReqChip, {
                  backgroundColor: hasEnoughPieces ? recipe.pieceColor + '18' : colors.background,
                  borderColor: hasEnoughPieces ? recipe.pieceColor : colors.border,
                }]}>
                  <Feather name={recipe.pieceIcon as any} size={12} color={hasEnoughPieces ? recipe.pieceColor : colors.mutedForeground} />
                  <Text style={[styles.craftReqText, { color: hasEnoughPieces ? recipe.pieceColor : colors.mutedForeground }]}>
                    {singleCount}/{recipe.requiredCount} {recipe.pieceName.split(' ')[1]}
                  </Text>
                </View>
              )}
              {(recipe.bitsCost ?? 0) > 0 && (
                <View style={[styles.craftReqChip, {
                  backgroundColor: hasEnoughBits ? '#facc1518' : colors.background,
                  borderColor: hasEnoughBits ? '#facc15' : colors.border,
                }]}>
                  <Image source={require('../../assets/images/bits-icon.png')} style={{ width: 16, height: 16, opacity: hasEnoughBits ? 1 : 0.4 }} resizeMode="contain" />
                  <Text style={[styles.craftReqText, { color: hasEnoughBits ? '#facc15' : colors.mutedForeground }]}>
                    {(recipe.bitsCost ?? 0).toLocaleString()} Bits
                  </Text>
                </View>
              )}
            </View>

            {/* Progress bar */}
            <View style={styles.craftProgressRow}>
              <View style={[styles.craftProgressTrack, { backgroundColor: colors.border }]}>
                <View style={[styles.craftProgressFill, { width: `${progress * 100}%` as any, backgroundColor: recipe.pieceColor }]} />
              </View>
              {isMulti ? (
                <Text style={[styles.craftProgressLabel, { color: recipe.pieceColor }]}>{Math.round(progress * 100)}%</Text>
              ) : (
                <Text style={[styles.craftProgressLabel, { color: recipe.pieceColor }]}>{singleCount}/{recipe.requiredCount}</Text>
              )}
            </View>

            {/* Button */}
            {alreadyCrafted ? (
              <View style={[styles.craftedBadge, { backgroundColor: '#22c55e22', borderColor: '#22c55e66' }]}>
                <Feather name="check-circle" size={14} color="#22c55e" />
                <Text style={[styles.craftedText, { color: '#22c55e' }]}>{recipe.resultItemName} forjado — na mochila!</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.craftBtn, {
                  backgroundColor: canCraft ? rarityColor + '28' : colors.background,
                  borderColor: canCraft ? rarityColor : colors.border,
                  opacity: canCraft ? 1 : 0.5,
                }]}
                onPress={() => { if (canCraft) craftItem(recipe); }}
                activeOpacity={canCraft ? 0.75 : 1}
                disabled={!canCraft}
              >
                <Feather name="tool" size={14} color={canCraft ? rarityColor : colors.mutedForeground} />
                <Text style={[styles.craftBtnText, { color: canCraft ? rarityColor : colors.mutedForeground }]}>
                  {btnLabel}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },

  sectionTitle: {
    fontSize: 14, fontWeight: '700' as const, letterSpacing: 0.5,
    marginBottom: 12, textTransform: 'uppercase',
  },

  fragmentSummaryRow: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    gap: 12, borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 24,
  },
  fragmentSummaryItem: { alignItems: 'center', gap: 4 },
  fragmentSummaryIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', position: 'relative' as const, overflow: 'visible' as const },
  puzzleOverlay: { position: 'absolute' as const, bottom: -4, right: -4 },
  puzzleEmoji: { fontSize: 12 },
  fragmentSummaryCount: { fontSize: 18, fontWeight: '800' as const },
  fragmentSummaryLabel: { fontSize: 11 },

  craftCard: { borderRadius: 16, borderWidth: 1.5, padding: 14, marginBottom: 14, gap: 10 },
  craftCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  craftPieceIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  craftItemImg: { width: 36, height: 36 },
  craftResultName: { fontSize: 15, fontWeight: '700' as const, marginBottom: 4 },
  craftRarityRow: { flexDirection: 'row' },
  craftRarityBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  craftRarityText: { fontSize: 11, fontWeight: '700' as const },
  craftReqRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  craftReqChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  craftReqText: { fontSize: 12, fontWeight: '600' as const },
  craftProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  craftProgressTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' as const },
  craftProgressFill: { height: 6, borderRadius: 3 },
  craftProgressLabel: { fontSize: 12, fontWeight: '700' as const, minWidth: 36, textAlign: 'right' as const },
  craftBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, borderWidth: 1.5, paddingVertical: 12 },
  craftBtnText: { fontSize: 13, fontWeight: '700' as const },
  craftedBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  craftedText: { fontSize: 12, fontWeight: '600' as const },
});
