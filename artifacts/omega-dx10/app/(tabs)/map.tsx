import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { GAME_MAPS, CHARACTERS, ATTRIBUTES, ELEMENTS } from '@/constants/gameData';

export default function MapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isStageCleared, isMapUnlocked, selectedCharacter, collection } = useGame();
  const [expandedMap, setExpandedMap] = useState<string>('map_forest');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  function handleStagePress(mapId: string, stageIndex: number) {
    if (!selectedCharacter) {
      return;
    }
    router.push(`/battle?mapId=${mapId}&stageIndex=${stageIndex}`);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Mundo</Text>
        {!selectedCharacter && (
          <View style={[styles.warnBadge, { backgroundColor: '#facc15' + '22', borderColor: '#facc15' }]}>
            <Feather name="alert-triangle" size={12} color="#facc15" />
            <Text style={[styles.warnText, { color: '#facc15' }]}>Selecione um Digimon</Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 100 + bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {GAME_MAPS.map((map) => {
          const unlocked = isMapUnlocked(map.id);
          const expanded = expandedMap === map.id;
          const clearedInMap = map.stages.filter((s) => isStageCleared(map.id, s.index)).length;
          const allCleared = clearedInMap === map.stages.length;

          return (
            <View key={map.id} style={[styles.mapCard, { backgroundColor: colors.card, borderColor: unlocked ? (allCleared ? '#22c55e' : colors.border) : colors.border + '44' }]}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => unlocked && setExpandedMap(expanded ? '' : map.id)}
                style={styles.mapHeader}
              >
                <View style={[styles.mapIcon, { backgroundColor: unlocked ? (allCleared ? '#22c55e22' : colors.secondary) : '#ffffff11' }]}>
                  {unlocked ? (
                    allCleared ? (
                      <Feather name="check-circle" size={24} color="#22c55e" />
                    ) : (
                      <Feather name="map" size={24} color={colors.primary} />
                    )
                  ) : (
                    <Feather name="lock" size={24} color={colors.mutedForeground} />
                  )}
                </View>
                <View style={styles.mapInfo}>
                  <Text style={[styles.mapName, { color: unlocked ? colors.foreground : colors.mutedForeground }]}>{map.name}</Text>
                  <Text style={[styles.mapDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{map.description}</Text>
                  {!unlocked && (
                    <Text style={[styles.lockHint, { color: colors.mutedForeground }]}>
                      Complete o mapa anterior para desbloquear
                    </Text>
                  )}
                </View>
                <View style={styles.mapRight}>
                  <Text style={[styles.mapProgress, { color: allCleared ? '#22c55e' : colors.primary }]}>
                    {clearedInMap}/{map.stages.length}
                  </Text>
                  {unlocked && (
                    <Feather
                      name={expanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={colors.mutedForeground}
                    />
                  )}
                </View>
              </TouchableOpacity>

              {expanded && unlocked && (
                <View style={[styles.stagesContainer, { borderTopColor: colors.border }]}>
                  {map.stages.map((stage) => {
                    const cleared = isStageCleared(map.id, stage.index);
                    const enemyChar = CHARACTERS[stage.enemyCharacterId];
                    const enemyAttr = enemyChar ? ATTRIBUTES[enemyChar.attribute] : null;
                    const enemyElem = enemyChar ? ELEMENTS[enemyChar.element] : null;
                    const canPlay = !!selectedCharacter;

                    return (
                      <TouchableOpacity
                        key={stage.index}
                        activeOpacity={canPlay ? 0.8 : 1}
                        onPress={() => canPlay && handleStagePress(map.id, stage.index)}
                        style={[
                          styles.stageRow,
                          { borderBottomColor: colors.border },
                          cleared && { backgroundColor: '#22c55e11' },
                        ]}
                      >
                        <View style={[styles.stageNum, { backgroundColor: cleared ? '#22c55e22' : colors.secondary, borderColor: cleared ? '#22c55e' : colors.border }]}>
                          {cleared ? (
                            <Feather name="check" size={14} color="#22c55e" />
                          ) : (
                            <Text style={[styles.stageNumText, { color: colors.mutedForeground }]}>{stage.index + 1}</Text>
                          )}
                        </View>
                        <View style={styles.stageInfo}>
                          <Text style={[styles.stageName, { color: colors.foreground }]}>{stage.name}</Text>
                          {enemyChar && (
                            <View style={styles.enemyRow}>
                              <Feather name="zap" size={12} color={enemyAttr?.color ?? colors.mutedForeground} />
                              <Text style={[styles.enemyName, { color: colors.mutedForeground }]}>
                                {enemyChar.name} Lv{stage.enemyLevel}
                              </Text>
                              <View style={[styles.elemTag, { backgroundColor: (enemyElem?.color ?? '#6b7280') + '33', borderColor: enemyElem?.color ?? '#6b7280' }]}>
                                <Text style={[styles.elemTagText, { color: enemyElem?.color ?? '#6b7280' }]}>{enemyElem?.label}</Text>
                              </View>
                            </View>
                          )}
                          {stage.unlockCharacterId && !cleared && (
                            <View style={styles.rewardRow}>
                              <Feather name="gift" size={11} color="#f59e0b" />
                              <Text style={[styles.rewardText, { color: '#f59e0b' }]}>
                                Desbloqueia {CHARACTERS[stage.unlockCharacterId]?.name}
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.stageRight}>
                          <View style={[styles.expTag, { backgroundColor: colors.primary + '22' }]}>
                            <Text style={[styles.expText, { color: colors.primary }]}>+{stage.expReward} EXP</Text>
                          </View>
                          {canPlay && (
                            <Feather name="chevron-right" size={16} color={cleared ? '#22c55e' : colors.mutedForeground} />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
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
  warnBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  warnText: { fontSize: 11, fontWeight: '600' as const },
  content: { padding: 20, gap: 14 },
  mapCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  mapHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  mapIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  mapInfo: { flex: 1 },
  mapName: { fontSize: 17, fontWeight: '700' as const, marginBottom: 4 },
  mapDesc: { fontSize: 12, lineHeight: 16 },
  lockHint: { fontSize: 11, marginTop: 4 },
  mapRight: { alignItems: 'center', gap: 4 },
  mapProgress: { fontSize: 16, fontWeight: '800' as const },
  stagesContainer: { borderTopWidth: 1 },
  stageRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, gap: 12 },
  stageNum: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  stageNumText: { fontSize: 13, fontWeight: '700' as const },
  stageInfo: { flex: 1, gap: 4 },
  stageName: { fontSize: 14, fontWeight: '600' as const },
  enemyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  enemyName: { fontSize: 12 },
  elemTag: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1 },
  elemTagText: { fontSize: 10, fontWeight: '700' as const },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rewardText: { fontSize: 11, fontWeight: '600' as const },
  stageRight: { alignItems: 'center', gap: 6 },
  expTag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  expText: { fontSize: 11, fontWeight: '700' as const },
});
