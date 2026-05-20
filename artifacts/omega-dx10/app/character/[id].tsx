import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import {
  CHARACTERS,
  ATTRIBUTES,
  ELEMENTS,
  RARITY_COLORS,
  RARITY_LABELS,
  getScaledStats,
  expToNextLevel,
} from '@/constants/gameData';
import { AttributeBadge, ElementBadge, StatBar, CharacterAvatar } from '@/components/GameComponents';

export default function CharacterDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { collection, selectedCharacter, setSelectedCharacter } = useGame();

  const owned = collection.find((c) => c.ownedId === id);
  const char = owned ? CHARACTERS[owned.characterId] : null;

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

  const scaled = getScaledStats(char.baseStats, owned.level);
  const expNeeded = expToNextLevel(owned.level);
  const expPct = Math.min(1, owned.exp / expNeeded);
  const rarityColor = RARITY_COLORS[char.rarity];
  const attrData = ATTRIBUTES[char.attribute];
  const elemData = ELEMENTS[char.element];
  const isSelected = selectedCharacter?.ownedId === owned.ownedId;

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 8, paddingBottom: 60 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Back button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Feather name="arrow-left" size={22} color={colors.primary} />
      </TouchableOpacity>

      {/* Hero Card */}
      <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: attrData.color + '66' }]}>
        <View style={[styles.heroStrip, { backgroundColor: rarityColor + '22' }]}>
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
            <Text style={[styles.expValue, { color: colors.foreground }]}>{owned.exp} / {expNeeded}</Text>
          </View>
          <View style={[styles.expTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.expFill, { width: `${expPct * 100}%` as any, backgroundColor: colors.primary }]} />
          </View>
          <Text style={[styles.expNext, { color: colors.mutedForeground }]}>
            {expNeeded - owned.exp} EXP para Nível {owned.level + 1}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Atributos</Text>
        <StatBar label="HP"  value={scaled.hp}  max={400} color="#22c55e" />
        <StatBar label="MP"  value={scaled.mp}  max={300} color="#00d4ff" />
        <StatBar label="ATK" value={scaled.atk} max={250} color="#ef4444" />
        <StatBar label="DEF" value={scaled.def} max={250} color="#3b82f6" />
        <StatBar label="SPT" value={scaled.spt} max={250} color="#a855f7" />
        <StatBar label="SPD" value={scaled.spd} max={200} color="#facc15" />
        <StatBar label="APT" value={scaled.apt} max={100} color="#f97316" />
      </View>

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
          { backgroundColor: isSelected ? '#22c55e22' : colors.primary, borderColor: isSelected ? '#22c55e' : 'transparent', borderWidth: isSelected ? 1.5 : 0 },
        ]}
      >
        <Feather name={isSelected ? 'check-circle' : 'zap'} size={18} color={isSelected ? '#22c55e' : colors.primaryForeground} />
        <Text style={[styles.selectBtnText, { color: isSelected ? '#22c55e' : colors.primaryForeground }]}>
          {isSelected ? 'Digimon Ativo' : 'Selecionar para Batalha'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  backBtn: { marginBottom: 16, alignSelf: 'flex-start', padding: 4 },
  errorText: { textAlign: 'center', fontSize: 16, margin: 40 },
  heroCard: { borderRadius: 20, borderWidth: 1.5, overflow: 'hidden', marginBottom: 16 },
  heroStrip: { alignItems: 'center', paddingTop: 24, paddingBottom: 16 },
  heroAvatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
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
  advCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700' as const, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 },
  advRow: { gap: 8 },
  advTag: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, padding: 10 },
  advText: { fontSize: 13, fontWeight: '600' as const },
  selectBtn: { borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  selectBtnText: { fontSize: 16, fontWeight: '700' as const },
});
