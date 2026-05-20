import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Platform, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { CHARACTERS, ATTRIBUTES, ELEMENTS } from '@/constants/gameData';
import { CharacterCard } from '@/components/GameComponents';

export default function CollectionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { collection, selectedCharacter, setSelectedCharacter } = useGame();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Codex</Text>
        <View style={[styles.countBadge, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}>
          <Text style={[styles.countText, { color: colors.primary }]}>{collection.length} / 3</Text>
        </View>
      </View>

      {collection.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="inbox" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nenhum Digimon</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Vença batalhas para coletar novos Digimons</Text>
        </View>
      ) : (
        <FlatList
          data={collection}
          keyExtractor={(item) => item.ownedId}
          contentContainerStyle={[styles.list, { paddingBottom: 100 + bottomPad }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <CharacterCard
              owned={item}
              isSelected={selectedCharacter?.ownedId === item.ownedId}
              onPress={() => router.push(`/character/${item.ownedId}`)}
            />
          )}
        />
      )}
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
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700' as const },
  emptyText: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
});
