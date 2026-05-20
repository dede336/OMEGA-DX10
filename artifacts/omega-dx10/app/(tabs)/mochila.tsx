import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, TextInput, Image,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import {
  EQUIP_SLOT_LABELS, EQUIP_SLOT_ICONS, EQUIPMENT_ITEMS, EQUIP_SLOTS_ORDER,
  RARITY_COLORS, RARITY_LABELS, ELEMENTS, CRAFT_RECIPES, EquipSlot, TamerGender,
  TAMERS, tamerExpToNextLevel,
} from '@/constants/gameData';
import EQUIP_ITEM_IMAGES from '@/constants/equipImages';

const GENDER_OPTIONS: { value: TamerGender; label: string; icon: string }[] = [
  { value: 'M', label: 'Masculino', icon: 'user' },
  { value: 'F', label: 'Feminino',  icon: 'user' },
  { value: 'N', label: 'Neutro',    icon: 'user' },
];

export default function MochilaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const game = useGame();
  const {
    playerName, gender, tamerId, inventory, equippedItems, pieces, bits,
    tamerExp, tamerLevel,
    setGender, equipItem, unequipItem, setPlayerName, craftItem,
  } = game;

  const selectedTamer = TAMERS.find((t) => t.id === tamerId) ?? null;

  const [selectedSlot, setSelectedSlot] = useState<EquipSlot | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(playerName);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = 100 + (Platform.OS === 'web' ? 34 : insets.bottom);

  const totalBonus = game.totalEquipBonus();
  const bonusEntries = Object.entries(totalBonus).filter(([, v]) => (v ?? 0) > 0);

  const slotItems = selectedSlot
    ? EQUIPMENT_ITEMS.filter((i) => i.slot === selectedSlot && inventory.includes(i.id))
    : [];

  function handleSlotPress(slot: EquipSlot) {
    setSelectedSlot((prev) => (prev === slot ? null : slot));
  }

  function handleEquip(itemId: string) {
    if (!selectedSlot) return;
    if (equippedItems[selectedSlot] === itemId) {
      unequipItem(selectedSlot);
    } else {
      equipItem(selectedSlot, itemId);
    }
  }

  function saveName() {
    const trimmed = nameInput.trim();
    if (trimmed.length > 0) setPlayerName(trimmed);
    setEditingName(false);
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 20, paddingBottom: botPad }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Tamer Card ── */}
      <View style={[styles.tamerCard, { backgroundColor: colors.card, borderColor: selectedTamer ? selectedTamer.accentColor + '88' : colors.border }]}>
        <View style={styles.tamerAvatarWrap}>
          {selectedTamer ? (
            <View style={[styles.tamerAvatarImg, { borderColor: selectedTamer.accentColor }]}>
              <ExpoImage
                source={selectedTamer.image}
                style={[styles.tamerAvatarImageStyle, { marginTop: selectedTamer.avatarOffset }]}
                contentFit="cover"
              />
            </View>
          ) : (
            <View style={[styles.tamerAvatar, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}>
              <Feather name="user" size={40} color={colors.primary} />
            </View>
          )}
          {gender === 'M' && (
            <View style={[styles.genderBadge, { backgroundColor: '#3b82f6' }]}>
              <Text style={styles.genderBadgeText}>♂</Text>
            </View>
          )}
          {gender === 'F' && (
            <View style={[styles.genderBadge, { backgroundColor: '#ec4899' }]}>
              <Text style={styles.genderBadgeText}>♀</Text>
            </View>
          )}
          {gender === 'N' && (
            <View style={[styles.genderBadge, { backgroundColor: '#a855f7' }]}>
              <Text style={styles.genderBadgeText}>⚧</Text>
            </View>
          )}
        </View>

        <View style={styles.tamerInfo}>
          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={[styles.nameInput, { color: colors.foreground, borderColor: colors.primary }]}
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                maxLength={16}
                onBlur={saveName}
                onSubmitEditing={saveName}
                returnKeyType="done"
              />
              <TouchableOpacity onPress={saveName} style={styles.nameConfirm}>
                <Feather name="check" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.nameRow} onPress={() => { setNameInput(playerName); setEditingName(true); }}>
              <Text style={[styles.tamerName, { color: colors.foreground }]}>{playerName}</Text>
              <Feather name="edit-2" size={14} color={colors.mutedForeground} style={{ marginLeft: 6, marginTop: 4 }} />
            </TouchableOpacity>
          )}
          <Text style={[styles.tamerLabel, { color: colors.mutedForeground }]}>Tamer Digital</Text>
          {/* Tamer XP Bar */}
          <View style={styles.tamerXpRow}>
            <Text style={[styles.tamerXpLabel, { color: colors.mutedForeground }]}>
              Lv {tamerLevel}
            </Text>
            <View style={[styles.tamerXpBarBg, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.tamerXpBarFill,
                  {
                    backgroundColor: selectedTamer?.accentColor ?? colors.primary,
                    width: `${Math.min(100, (tamerExp / tamerExpToNextLevel(tamerLevel)) * 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.tamerXpNum, { color: colors.mutedForeground }]}>
              {tamerExp}/{tamerExpToNextLevel(tamerLevel)}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Gênero ── */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Gênero do Tamer</Text>
      <View style={styles.genderRow}>
        {GENDER_OPTIONS.map((opt) => {
          const active = gender === opt.value;
          const col = opt.value === 'M' ? '#3b82f6' : opt.value === 'F' ? '#ec4899' : '#a855f7';
          return (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.genderBtn,
                { borderColor: active ? col : colors.border, backgroundColor: active ? col + '22' : colors.card },
              ]}
              onPress={() => setGender(opt.value)}
              activeOpacity={0.8}
            >
              <Text style={[styles.genderSymbol, { color: active ? col : colors.mutedForeground }]}>
                {opt.value === 'M' ? '♂' : opt.value === 'F' ? '♀' : '⚧'}
              </Text>
              <Text style={[styles.genderLabel, { color: active ? col : colors.mutedForeground }]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Equipamentos ── */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Equipamentos</Text>
      <View style={styles.slotsGrid}>
        {EQUIP_SLOTS_ORDER.map((slot) => {
          const equippedId = equippedItems[slot];
          const equippedItem = equippedId ? EQUIPMENT_ITEMS.find((i) => i.id === equippedId) : null;
          const isSelected = selectedSlot === slot;
          const rarityCol = equippedItem ? RARITY_COLORS[equippedItem.rarity] : null;

          return (
            <TouchableOpacity
              key={slot}
              style={[
                styles.slotCard,
                {
                  backgroundColor: isSelected
                    ? colors.primary + '18'
                    : equippedItem ? rarityCol + '12' : colors.card,
                  borderColor: isSelected
                    ? colors.primary
                    : equippedItem ? rarityCol + '88' : colors.border,
                },
              ]}
              onPress={() => handleSlotPress(slot)}
              activeOpacity={0.8}
            >
              <View style={[styles.slotIconWrap, { backgroundColor: (rarityCol ?? colors.primary) + '22' }]}>
                <Feather
                  name={EQUIP_SLOT_ICONS[slot] as any}
                  size={18}
                  color={rarityCol ?? colors.primary}
                />
              </View>
              <Text style={[styles.slotName, { color: colors.mutedForeground }]}>{EQUIP_SLOT_LABELS[slot]}</Text>
              {equippedItem ? (
                <>
                  <Text style={[styles.slotItemName, { color: rarityCol ?? colors.foreground }]} numberOfLines={1}>
                    {equippedItem.name}
                  </Text>
                  <View style={[styles.rarityPill, { backgroundColor: rarityCol + '33' }]}>
                    <Text style={[styles.rarityPillText, { color: rarityCol ?? colors.foreground }]}>
                      {RARITY_LABELS[equippedItem.rarity]}
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={[styles.slotEmpty, { color: colors.mutedForeground }]}>Vazio</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Item Picker ── */}
      {selectedSlot && (
        <View style={[styles.pickerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.pickerTitle, { color: colors.foreground }]}>
            {EQUIP_SLOT_LABELS[selectedSlot]} — Selecionar Item
          </Text>

          {slotItems.length === 0 ? (
            <View style={styles.pickerEmpty}>
              <Feather name="package" size={28} color={colors.mutedForeground} />
              <Text style={[styles.pickerEmptyText, { color: colors.mutedForeground }]}>
                Nenhum item disponível neste slot
              </Text>
            </View>
          ) : (
            slotItems.map((item) => {
              const isEquipped = equippedItems[selectedSlot] === item.id;
              const rc = RARITY_COLORS[item.rarity];
              const bonusStr = Object.entries(item.bonuses)
                .map(([k, v]) => `+${v} ${k.toUpperCase()}`)
                .join('  ');

              const itemImg = EQUIP_ITEM_IMAGES[item.id];
              const elemBonus = item.elementBonus;
              const elemLabel = elemBonus ? ELEMENTS[elemBonus.element]?.label : null;
              const elemColor = elemBonus ? ELEMENTS[elemBonus.element]?.color : null;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.pickerItem,
                    {
                      backgroundColor: isEquipped ? rc + '22' : colors.background,
                      borderColor: isEquipped ? rc : colors.border,
                    },
                  ]}
                  onPress={() => handleEquip(item.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.pickerItemLeft}>
                    {itemImg ? (
                      <Image source={itemImg} style={styles.pickerItemImg} resizeMode="contain" />
                    ) : (
                      <View style={[styles.pickerRarityDot, { backgroundColor: rc }]} />
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={styles.pickerItemNameRow}>
                        <Text style={[styles.pickerItemName, { color: colors.foreground }]}>{item.name}</Text>
                        <View style={[styles.rarityPill, { backgroundColor: rc + '33', marginLeft: 6 }]}>
                          <Text style={[styles.rarityPillText, { color: rc }]}>{RARITY_LABELS[item.rarity]}</Text>
                        </View>
                      </View>
                      {bonusStr.length > 0 && (
                        <Text style={[styles.pickerItemBonus, { color: rc }]}>{bonusStr}</Text>
                      )}
                      {elemBonus && elemLabel && elemColor && (
                        <View style={[styles.elemBonusRow, { backgroundColor: elemColor + '22', borderColor: elemColor + '55' }]}>
                          <Text style={[styles.elemBonusText, { color: elemColor }]}>
                            ✦ +{Math.round(elemBonus.percent * 100)}% todos os stats — {elemLabel}
                          </Text>
                        </View>
                      )}
                      <Text style={[styles.pickerItemDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                        {item.description}
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.equipBtn,
                    { backgroundColor: isEquipped ? rc + '33' : colors.primary + '22', borderColor: isEquipped ? rc : colors.primary },
                  ]}>
                    <Text style={[styles.equipBtnText, { color: isEquipped ? rc : colors.primary }]}>
                      {isEquipped ? 'Retirar' : 'Equipar'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      )}

      {/* ── Fragmentos & Crafting ── */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Crafting</Text>

      {/* Fragment inventory summary */}
      <View style={[styles.fragmentSummaryRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {[
          { id: 'piece_coragem',        label: 'Coragem', icon: 'zap',      color: '#ef4444' },
          { id: 'piece_brasao_coragem', label: 'Brasão',  icon: 'sun',      color: '#f97316' },
          { id: 'piece_gelo',           label: 'Gelo',    icon: 'droplet',  color: '#38bdf8' },
          { id: 'piece_caos',           label: 'Caos',    icon: 'cpu',      color: '#a855f7' },
          { id: 'piece_tecido',         label: 'Tecido',  icon: 'layers',   color: '#ec4899' },
          { id: 'piece_agulha',         label: 'Agulha',  icon: 'edit-2',   color: '#8b5cf6' },
          { id: 'piece_linha',          label: 'Linha',   icon: 'wind',     color: '#06b6d4' },
        ].map((p) => (
          <View key={p.id} style={styles.fragmentSummaryItem}>
            <View style={[styles.fragmentSummaryIcon, { backgroundColor: p.color + '22' }]}>
              <Feather name={p.icon as any} size={16} color={p.color} />
            </View>
            <Text style={[styles.fragmentSummaryCount, { color: colors.foreground }]}>{pieces[p.id] ?? 0}</Text>
            <Text style={[styles.fragmentSummaryLabel, { color: colors.mutedForeground }]}>{p.label}</Text>
          </View>
        ))}
      </View>

      {/* Recipe cards */}
      {CRAFT_RECIPES.map((recipe, idx) => {
        const count = pieces[recipe.pieceId] ?? 0;
        const hasEnoughPieces = count >= recipe.requiredCount;
        const hasEnoughBits = bits >= (recipe.bitsCost ?? 0);
        const alreadyCrafted = inventory.includes(recipe.resultItemId);
        const canCraft = hasEnoughPieces && hasEnoughBits && !alreadyCrafted;
        const progress = Math.min(1, count / recipe.requiredCount);
        const rarityColor = RARITY_COLORS[recipe.resultRarity];
        const rarityLabel = RARITY_LABELS[recipe.resultRarity];

        return (
          <View
            key={`${recipe.resultItemId}-${idx}`}
            style={[styles.craftCard, { backgroundColor: colors.card, borderColor: alreadyCrafted ? '#22c55e66' : canCraft ? rarityColor + '88' : colors.border }]}
          >
            {/* Header */}
            <View style={styles.craftCardHeader}>
              <View style={[styles.craftPieceIcon, { backgroundColor: recipe.pieceColor + '22' }]}>
                <Feather name={recipe.pieceIcon as any} size={18} color={recipe.pieceColor} />
              </View>
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
              {/* Pieces */}
              <View style={[styles.craftReqChip, {
                backgroundColor: hasEnoughPieces ? recipe.pieceColor + '18' : colors.background,
                borderColor: hasEnoughPieces ? recipe.pieceColor : colors.border,
              }]}>
                <Feather name={recipe.pieceIcon as any} size={12} color={hasEnoughPieces ? recipe.pieceColor : colors.mutedForeground} />
                <Text style={[styles.craftReqText, { color: hasEnoughPieces ? recipe.pieceColor : colors.mutedForeground }]}>
                  {count}/{recipe.requiredCount} {recipe.pieceName.split(' ')[1]}
                </Text>
              </View>
              {/* Bits cost */}
              {(recipe.bitsCost ?? 0) > 0 && (
                <View style={[styles.craftReqChip, {
                  backgroundColor: hasEnoughBits ? '#facc1518' : colors.background,
                  borderColor: hasEnoughBits ? '#facc15' : colors.border,
                }]}>
                  <Feather name="dollar-sign" size={12} color={hasEnoughBits ? '#facc15' : colors.mutedForeground} />
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
              <Text style={[styles.craftProgressLabel, { color: recipe.pieceColor }]}>{count}/{recipe.requiredCount}</Text>
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
                  {canCraft ? `Forjar ${recipe.resultItemName}` : !hasEnoughPieces ? `Faltam ${recipe.requiredCount - count} fragmentos` : `Faltam ${((recipe.bitsCost ?? 0) - bits).toLocaleString()} Bits`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {/* ── Total Bonus ── */}
      {bonusEntries.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Bônus Total do Tamer</Text>
          <View style={[styles.bonusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.bonusGrid}>
              {bonusEntries.map(([key, val]) => (
                <View key={key} style={[styles.bonusChip, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '44' }]}>
                  <Text style={[styles.bonusKey, { color: colors.mutedForeground }]}>{key.toUpperCase()}</Text>
                  <Text style={[styles.bonusVal, { color: colors.primary }]}>+{val}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.bonusNote, { color: colors.mutedForeground }]}>
              Aplicado ao Digimon parceiro em batalha
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },

  tamerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    borderRadius: 16, borderWidth: 1, padding: 18, marginBottom: 24,
  },
  tamerAvatarWrap: { position: 'relative' },
  tamerAvatar: {
    width: 72, height: 72, borderRadius: 36, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  tamerAvatarImg: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 2.5,
    overflow: 'hidden' as const,
    backgroundColor: 'transparent',
  },
  tamerAvatarImageStyle: {
    width: '100%' as unknown as number,
    height: 180,
    marginTop: -8,
  },
  genderBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  genderBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' as const },
  tamerInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  tamerName: { fontSize: 22, fontWeight: '800' as const },
  tamerLabel: { fontSize: 12, marginTop: 2 },
  tamerXpRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 },
  tamerXpLabel: { fontSize: 11, fontWeight: '700' as const, minWidth: 28 },
  tamerXpBarBg: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' as const },
  tamerXpBarFill: { height: 6, borderRadius: 3 },
  tamerXpNum: { fontSize: 10, minWidth: 36, textAlign: 'right' as const },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameInput: {
    flex: 1, fontSize: 20, fontWeight: '700' as const,
    borderBottomWidth: 2, paddingVertical: 2,
  },
  nameConfirm: { padding: 4 },

  sectionTitle: {
    fontSize: 14, fontWeight: '700' as const, letterSpacing: 0.5,
    marginBottom: 12, textTransform: 'uppercase',
  },

  genderRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  genderBtn: {
    flex: 1, borderRadius: 14, borderWidth: 1.5,
    paddingVertical: 14, alignItems: 'center', gap: 4,
  },
  genderSymbol: { fontSize: 22, fontWeight: '700' as const },
  genderLabel: { fontSize: 11, fontWeight: '600' as const },

  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  slotCard: {
    width: '47%', borderRadius: 14, borderWidth: 1.5,
    padding: 12, alignItems: 'center', gap: 6,
  },
  slotIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  slotName: { fontSize: 11, fontWeight: '600' as const, textTransform: 'uppercase', letterSpacing: 0.5 },
  slotItemName: { fontSize: 13, fontWeight: '700' as const, textAlign: 'center' },
  slotEmpty: { fontSize: 12, fontStyle: 'italic' },
  rarityPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  rarityPillText: { fontSize: 10, fontWeight: '700' as const },

  pickerCard: {
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 24, gap: 12,
  },
  pickerTitle: { fontSize: 14, fontWeight: '700' as const, marginBottom: 4 },
  pickerEmpty: { alignItems: 'center', paddingVertical: 20, gap: 10 },
  pickerEmptyText: { fontSize: 13 },
  pickerItem: {
    borderRadius: 14, borderWidth: 1.5, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  pickerItemLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  pickerRarityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  pickerItemImg: { width: 44, height: 44 },
  elemBonusRow: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 4, alignSelf: 'flex-start' as const },
  elemBonusText: { fontSize: 11, fontWeight: '700' as const },
  pickerItemNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 3 },
  pickerItemName: { fontSize: 14, fontWeight: '700' as const },
  pickerItemBonus: { fontSize: 12, fontWeight: '700' as const, marginBottom: 3 },
  pickerItemDesc: { fontSize: 12, lineHeight: 17 },
  equipBtn: {
    borderRadius: 10, borderWidth: 1.5,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  equipBtnText: { fontSize: 12, fontWeight: '700' as const },

  fragmentCard: { borderRadius: 16, borderWidth: 1.5, padding: 16, marginBottom: 16, gap: 12 },
  fragmentTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fragmentImg: { width: 52, height: 52 },
  fragmentName: { fontSize: 15, fontWeight: '700' as const, marginBottom: 3 },
  fragmentDesc: { fontSize: 12, lineHeight: 17 },
  fragmentProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fragmentTrack: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' as const },
  fragmentFill: { height: 8, borderRadius: 4 },
  fragmentCount: { fontSize: 13, fontWeight: '700' as const, minWidth: 45, textAlign: 'right' as const },
  // craft summary
  fragmentSummaryRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  fragmentSummaryItem: { alignItems: 'center', gap: 4 },
  fragmentSummaryIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  fragmentSummaryCount: { fontSize: 18, fontWeight: '800' as const },
  fragmentSummaryLabel: { fontSize: 11 },
  // craft cards
  craftCard: { borderRadius: 16, borderWidth: 1.5, padding: 14, marginBottom: 14, gap: 10 },
  craftCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  craftPieceIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
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
  bonusCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  bonusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  bonusChip: {
    borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8,
    alignItems: 'center', minWidth: 70,
  },
  bonusKey: { fontSize: 10, fontWeight: '600' as const },
  bonusVal: { fontSize: 18, fontWeight: '800' as const },
  bonusNote: { fontSize: 11, textAlign: 'center' },
});
