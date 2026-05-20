import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { CHARACTERS, EVOLUTIONS, SCANNABLE_CHARACTERS, CODEX_ORDER } from '@/constants/gameData';
import { CharacterCard, ScanCard, LockedCard } from '@/components/GameComponents';

export default function CollectionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { collection, selectedCharacter, setSelectedCharacter, scanProgress, createFromScan, evolveDigimon } = useGame();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const ownedCount = collection.length;
  const totalCount = Object.keys(CHARACTERS).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Codex</Text>
        <View style={[styles.countBadge, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}>
          <Text style={[styles.countText, { color: colors.primary }]}>{ownedCount} / {totalCount}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: 100 + bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {CODEX_ORDER.map((charId) => {
          const owned = collection.find((c) => c.characterId === charId);
          const isScannable = SCANNABLE_CHARACTERS.includes(charId);
          const scan = scanProgress[charId] ?? 0;
          const evo = owned ? EVOLUTIONS[owned.characterId] : undefined;
          const canEvolve = owned && evo && owned.level >= evo.requiredLevel;

          if (owned) {
            return (
              <View key={owned.ownedId}>
                <CharacterCard
                  owned={owned}
                  isSelected={selectedCharacter?.ownedId === owned.ownedId}
                  onPress={() => {
                    setSelectedCharacter(owned.ownedId);
                    router.push(`/character/${owned.ownedId}`);
                  }}
                />
                {canEvolve && evo && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => evolveDigimon(owned.ownedId)}
                    style={[styles.evolveBtn, { backgroundColor: '#f59e0b', marginTop: -8 }]}
                  >
                    <Feather name="arrow-up-circle" size={18} color="#000" />
                    <Text style={styles.evolveBtnText}>
                      Evoluir para {evo.label}  (Nível {evo.requiredLevel}+)
                    </Text>
                  </TouchableOpacity>
                )}
                {evo && !canEvolve && (
                  <View style={[styles.evoHint, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                    <Feather name="info" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.evoHintText, { color: colors.mutedForeground }]}>
                      Alcance o Nível {evo.requiredLevel} para evoluir para {evo.label}
                    </Text>
                  </View>
                )}
              </View>
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

          return (
            <LockedCard
              key={charId}
              label="Evolução Champion"
              hint="Evolua um Agumon para o Nível 16 para desbloquear"
            />
          );
        })}

        {/* Scanner info banner */}
        <View style={[styles.infoBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="cpu" size={16} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Vença batalhas para ganhar{' '}
            <Text style={{ color: colors.primary, fontWeight: '700' }}>+5% de scan</Text>
            {' '}do Digimon inimigo. Com 100% você pode criar um novo Digimon!
          </Text>
        </View>
      </ScrollView>
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
  list: { paddingHorizontal: 20, paddingTop: 16, gap: 0 },
  evolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 14,
    marginTop: -4,
  },
  evolveBtnText: { fontSize: 14, fontWeight: '700' as const, color: '#000' },
  evoHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    marginTop: -4,
  },
  evoHintText: { fontSize: 12, flex: 1, lineHeight: 16 },
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
});
