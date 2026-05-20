import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { CHARACTERS, ATTRIBUTES, GAME_MAPS, getScaledStats } from '@/constants/gameData';
import { AttributeBadge, ElementBadge, HPBar, CharacterAvatar } from '@/components/GameComponents';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const game = useGame();
  const { selectedCharacter, collection, clearedStages, playerName, totalPlayerLevel } = game;

  const totalStages = GAME_MAPS.reduce((s, m) => s + m.stages.length, 0);
  const clearedCount = Object.keys(clearedStages).length;

  const char = selectedCharacter ? CHARACTERS[selectedCharacter.characterId] : null;
  const scaled = char && selectedCharacter ? getScaledStats(char.baseStats, selectedCharacter.level) : null;
  const attrData = char ? ATTRIBUTES[char.attribute] : null;

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 20, paddingBottom: 100 + (Platform.OS === 'web' ? 34 : insets.bottom) }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Bem-vindo,</Text>
          <Text style={[styles.playerName, { color: colors.foreground }]}>{playerName}</Text>
        </View>
        <View style={[styles.levelBadge, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}>
          <Text style={[styles.levelBadgeLabel, { color: colors.primary }]}>RANK</Text>
          <Text style={[styles.levelBadgeNum, { color: colors.primary }]}>{totalPlayerLevel}</Text>
        </View>
      </View>

      {/* Logo / Title */}
      <View style={[styles.titleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={[styles.gameSubtitle, { color: colors.mutedForeground }]}>Colecione. Evolua. Conquiste.</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="users" size={20} color={colors.primary} />
          <Text style={[styles.statNum, { color: colors.foreground }]}>{collection.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Digimons</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="map" size={20} color="#22c55e" />
          <Text style={[styles.statNum, { color: colors.foreground }]}>{clearedCount}/{totalStages}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Estágios</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="star" size={20} color="#facc15" />
          <Text style={[styles.statNum, { color: colors.foreground }]}>{GAME_MAPS.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Mapas</Text>
        </View>
      </View>

      {/* Active Character */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Digimon Ativo</Text>
      {char && scaled && selectedCharacter && attrData ? (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/collection')}
          style={[styles.activeCard, { backgroundColor: colors.card, borderColor: attrData.color + '66' }]}
        >
          <View style={[styles.activeTopStrip, { backgroundColor: attrData.color + '33' }]}>
            <CharacterAvatar characterId={char.id} size={80} />
            <View style={styles.activeInfo}>
              <Text style={[styles.activeName, { color: colors.foreground }]}>{char.name}</Text>
              <View style={styles.activeBadges}>
                <AttributeBadge attr={char.attribute} />
                <View style={{ width: 6 }} />
                <ElementBadge elem={char.element} />
              </View>
              <Text style={[styles.activeLevel, { color: colors.primary }]}>Nível {selectedCharacter.level}</Text>
            </View>
          </View>
          <View style={styles.activeStats}>
            <View style={styles.activeStatCol}>
              <Text style={[styles.activeStatLabel, { color: colors.mutedForeground }]}>HP</Text>
              <HPBar current={scaled.hp} max={scaled.hp} color={colors.primary} />
            </View>
          </View>
          <View style={styles.activeStatGrid}>
            {[
              { k: 'ATK', v: scaled.atk, c: '#ef4444' },
              { k: 'DEF', v: scaled.def, c: '#3b82f6' },
              { k: 'SPT', v: scaled.spt, c: '#a855f7' },
              { k: 'SPD', v: scaled.spd, c: '#facc15' },
              { k: 'MP',  v: scaled.mp,  c: '#00d4ff' },
              { k: 'APT', v: scaled.apt, c: '#f97316' },
            ].map((s) => (
              <View key={s.k} style={[styles.miniStat, { backgroundColor: s.c + '11', borderColor: s.c + '44' }]}>
                <Text style={[styles.miniStatLabel, { color: colors.mutedForeground }]}>{s.k}</Text>
                <Text style={[styles.miniStatValue, { color: s.c }]}>{s.v}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>
      ) : (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="alert-circle" size={32} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Nenhum Digimon selecionado</Text>
        </View>
      )}

      {/* Quick Actions */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Ações Rápidas</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}
          onPress={() => router.push('/(tabs)/map')}
          activeOpacity={0.8}
        >
          <Feather name="map" size={22} color={colors.primary} />
          <Text style={[styles.actionLabel, { color: colors.primary }]}>Aventura</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.accent + '22', borderColor: colors.accent }]}
          onPress={() => router.push('/(tabs)/collection')}
          activeOpacity={0.8}
        >
          <Feather name="grid" size={22} color={colors.accent} />
          <Text style={[styles.actionLabel, { color: colors.accent }]}>Codex</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 13, fontWeight: '500' as const },
  playerName: { fontSize: 24, fontWeight: '800' as const },
  levelBadge: { alignItems: 'center', borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  levelBadgeLabel: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 1 },
  levelBadgeNum: { fontSize: 22, fontWeight: '800' as const },
  titleCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: { width: '100%', height: 110 },
  gameSubtitle: { fontSize: 13, marginTop: 4, letterSpacing: 1 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    padding: 14,
    gap: 4,
  },
  statNum: { fontSize: 20, fontWeight: '800' as const },
  statLabel: { fontSize: 11 },
  sectionTitle: { fontSize: 14, fontWeight: '700' as const, letterSpacing: 0.5, marginBottom: 12, textTransform: 'uppercase' },
  activeCard: { borderRadius: 16, borderWidth: 1.5, overflow: 'hidden', marginBottom: 24 },
  activeTopStrip: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  activeAvatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  activeInfo: { flex: 1 },
  activeName: { fontSize: 22, fontWeight: '800' as const, marginBottom: 6 },
  activeBadges: { flexDirection: 'row', marginBottom: 6 },
  activeLevel: { fontSize: 14, fontWeight: '700' as const },
  activeStats: { paddingHorizontal: 16, paddingBottom: 8 },
  activeStatCol: { gap: 4 },
  activeStatLabel: { fontSize: 11, fontWeight: '600' as const },
  activeStatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16, paddingTop: 0 },
  miniStat: { flex: 1, minWidth: '30%', borderRadius: 10, borderWidth: 1, padding: 10, alignItems: 'center' },
  miniStatLabel: { fontSize: 10, fontWeight: '600' as const },
  miniStatValue: { fontSize: 18, fontWeight: '800' as const },
  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 40, alignItems: 'center', gap: 12, marginBottom: 24 },
  emptyText: { fontSize: 14 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, borderRadius: 14, borderWidth: 1.5, padding: 18, alignItems: 'center', gap: 8 },
  actionLabel: { fontSize: 13, fontWeight: '700' as const },
});
