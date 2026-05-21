import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image, ImageBackground } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/context/AuthContext';
import { CHARACTERS, ATTRIBUTES, GAME_MAPS, getScaledStats, TAMERS } from '@/constants/gameData';
import { AttributeBadge, ElementBadge, HPBar, CharacterAvatar } from '@/components/GameComponents';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const game = useGame();
  const { user } = useAuth();
  const { selectedCharacter, collection, clearedStages, playerName, totalPlayerLevel, bits, tamerId } = game;

  const totalStages = GAME_MAPS.reduce((s, m) => s + m.stages.length, 0);
  const clearedCount = Object.keys(clearedStages).length;

  const char = selectedCharacter ? CHARACTERS[selectedCharacter.characterId] : null;
  const scaled = char && selectedCharacter ? getScaledStats(char.baseStats, selectedCharacter.level) : null;
  const attrData = char ? ATTRIBUTES[char.attribute] : null;

  const tamer = tamerId ? TAMERS.find((t) => t.id === tamerId) : null;

  const botPad = Platform.OS === 'web' ? 20 : insets.bottom + 20;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: botPad }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero banner ── */}
      <View style={[styles.heroBanner, { backgroundColor: colors.primary + '18' }]}>
        {/* Tamer portrait */}
        <View style={[styles.tamerPortrait, { borderColor: colors.primary + '88' }]}>
          {tamer ? (
            <Image
              source={tamer.image}
              style={[styles.tamerPortraitImg, { marginTop: tamer.avatarOffset }]}
              resizeMode="cover"
            />
          ) : (
            <Feather name="user" size={36} color={colors.primary} />
          )}
        </View>

        {/* Welcome text */}
        <View style={styles.heroText}>
          <Text style={[styles.heroGreeting, { color: colors.primary }]}>Bem-vindo,</Text>
          <Text style={[styles.heroName, { color: colors.foreground }]} numberOfLines={1}>{playerName}</Text>
          {tamer && (
            <Text style={[styles.heroTamer, { color: colors.primary + 'cc' }]}>{tamer.fullName}</Text>
          )}
        </View>

        {/* Rank badge + account */}
        <View style={styles.heroBadges}>
          <View style={[styles.rankBadge, { backgroundColor: colors.primary, }]}>
            <Text style={[styles.rankBadgeLabel, { color: colors.primaryForeground }]}>RANK</Text>
            <Text style={[styles.rankBadgeNum, { color: colors.primaryForeground }]}>{totalPlayerLevel}</Text>
          </View>
          {user ? (
            <View style={[styles.userBadge, { backgroundColor: '#22c55e22', borderColor: '#22c55e55' }]}>
              <Feather name="user-check" size={11} color="#22c55e" />
              <Text style={[styles.userBadgeText, { color: '#22c55e' }]} numberOfLines={1}>{user.username}</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => router.push('/login')}
              style={[styles.userBadge, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Feather name="log-in" size={11} color={colors.mutedForeground} />
              <Text style={[styles.userBadgeText, { color: colors.mutedForeground }]}>Entrar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Stats strip ── */}
      <View style={[styles.statsStrip, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.statItem}>
          <Image source={require('../../assets/images/digimon-icon.gif')} style={styles.statIcon} resizeMode="contain" />
          <Text style={[styles.statNum, { color: colors.foreground }]}>{collection.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Digimons</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Image source={require('../../assets/images/stages-icon.png')} style={styles.statIcon} resizeMode="contain" />
          <Text style={[styles.statNum, { color: colors.foreground }]}>{clearedCount}/{totalStages}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Estágios</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Image source={require('../../assets/images/bits-icon.png')} style={styles.statIcon} resizeMode="contain" />
          <Text style={[styles.statNum, { color: '#facc15' }]}>{bits >= 1000 ? `${(bits / 1000).toFixed(1)}k` : bits}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Bits</Text>
        </View>
      </View>

      <View style={styles.body}>
        {/* ── Quick Actions ── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '88' }]}
            onPress={() => router.push('/(tabs)/map')}
            activeOpacity={0.8}
          >
            <Image source={require('../../assets/images/map-icon.png')} style={styles.actionIcon} resizeMode="contain" />
            <Text style={[styles.actionLabel, { color: colors.primary }]}>Aventura</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.accent + '22', borderColor: colors.accent + '88' }]}
            onPress={() => router.push('/(tabs)/collection')}
            activeOpacity={0.8}
          >
            <Image source={require('../../assets/images/digibank-icon.png')} style={styles.actionIcon} tintColor={colors.accent} resizeMode="contain" />
            <Text style={[styles.actionLabel, { color: colors.accent }]}>Digibank</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#f59e0b22', borderColor: '#f59e0b88' }]}
            onPress={() => router.push('/(tabs)/mochila')}
            activeOpacity={0.8}
          >
            <Image source={require('../../assets/images/mochila-icon.png')} style={styles.actionIcon} tintColor="#f59e0b" resizeMode="contain" />
            <Text style={[styles.actionLabel, { color: '#f59e0b' }]}>Mochila</Text>
          </TouchableOpacity>
        </View>

        {/* ── Active Digimon ── */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Digimon Ativo</Text>
        {char && scaled && selectedCharacter && attrData ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/collection')}
            style={[styles.activeCard, { backgroundColor: colors.card, borderColor: attrData.color + '55' }]}
          >
            {/* top colored strip */}
            <View style={[styles.activeStrip, { backgroundColor: attrData.color + '22' }]}>
              <View style={[styles.activeAvatarRing, { borderColor: attrData.color + '88' }]}>
                <CharacterAvatar characterId={char.id} size={72} />
              </View>
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

            {/* HP */}
            <View style={styles.hpRow}>
              <Text style={[styles.hpLabel, { color: colors.mutedForeground }]}>HP</Text>
              <HPBar current={scaled.hp} max={scaled.hp} color={colors.primary} />
              <Text style={[styles.hpValue, { color: colors.mutedForeground }]}>{scaled.hp}/{scaled.hp}</Text>
            </View>

            {/* Stat grid */}
            <View style={styles.statGrid}>
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
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/collection')}
            style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="plus-circle" size={32} color={colors.primary} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Toque para selecionar um Digimon</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Hero
  heroBanner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14, gap: 12 },
  tamerPortrait: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, overflow: 'hidden' as const, backgroundColor: '#0f1629' },
  tamerPortraitImg: { width: 64, height: 110 },
  heroText: { flex: 1 },
  heroGreeting: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.5 },
  heroName: { fontSize: 20, fontWeight: '900' as const, marginTop: 1 },
  heroTamer: { fontSize: 11, fontWeight: '500' as const, marginTop: 1 },
  heroBadges: { alignItems: 'flex-end', gap: 6 },
  rankBadge: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center', minWidth: 52 },
  rankBadgeLabel: { fontSize: 9, fontWeight: '700' as const, letterSpacing: 1 },
  rankBadgeNum: { fontSize: 20, fontWeight: '900' as const, lineHeight: 22 },
  userBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, maxWidth: 100 },
  userBadgeText: { fontSize: 10, fontWeight: '700' as const, flexShrink: 1 },

  // Stats strip
  statsStrip: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, borderRadius: 14, borderWidth: 1, padding: 12 },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statDivider: { width: 1, marginVertical: 4 },
  statIcon: { width: 22, height: 22 },
  statNum: { fontSize: 17, fontWeight: '800' as const },
  statLabel: { fontSize: 10 },

  body: { paddingHorizontal: 16 },

  // Quick actions
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  actionBtn: { flex: 1, borderRadius: 14, borderWidth: 1.5, paddingVertical: 14, alignItems: 'center', gap: 6 },
  actionIcon: { width: 40, height: 40 },
  actionLabel: { fontSize: 12, fontWeight: '700' as const },

  sectionTitle: { fontSize: 13, fontWeight: '700' as const, letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' as const },

  // Active card
  activeCard: { borderRadius: 16, borderWidth: 1.5, overflow: 'hidden' as const, marginBottom: 20 },
  activeStrip: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 },
  activeAvatarRing: { borderRadius: 40, borderWidth: 2, padding: 2 },
  activeInfo: { flex: 1 },
  activeName: { fontSize: 20, fontWeight: '800' as const, marginBottom: 5 },
  activeBadges: { flexDirection: 'row', marginBottom: 5 },
  activeLevel: { fontSize: 13, fontWeight: '700' as const },
  hpRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingBottom: 8 },
  hpLabel: { fontSize: 10, fontWeight: '600' as const, width: 18 },
  hpValue: { fontSize: 10, width: 60, textAlign: 'right' as const },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap' as const, gap: 8, padding: 14, paddingTop: 0 },
  miniStat: { flex: 1, minWidth: '30%' as any, borderRadius: 10, borderWidth: 1, padding: 10, alignItems: 'center' },
  miniStatLabel: { fontSize: 10, fontWeight: '600' as const },
  miniStatValue: { fontSize: 18, fontWeight: '800' as const },

  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 40, alignItems: 'center', gap: 12, marginBottom: 20 },
  emptyText: { fontSize: 13, textAlign: 'center' as const },
});
