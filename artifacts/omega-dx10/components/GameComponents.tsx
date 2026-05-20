import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import {
  AttributeId, ElementId, ATTRIBUTES, ELEMENTS,
  RARITY_COLORS, RARITY_LABELS, RarityId, BaseStats,
  CHARACTERS, expToNextLevel, getScaledStats,
} from '@/constants/gameData';
import CHARACTER_IMAGES from '@/constants/characterImages';
import { OwnedCharacter } from '@/context/GameContext';

// ─── CharacterAvatar ───────────────────────────────────────────────────────────
interface AvatarProps {
  characterId: string;
  size?: number;
  borderColor?: string;
  bgColor?: string;
  dimmed?: boolean;
}

export function CharacterAvatar({ characterId, size = 72, borderColor, bgColor, dimmed }: AvatarProps) {
  const img = CHARACTER_IMAGES[characterId];
  const char = CHARACTERS[characterId];
  const attrData = char ? ATTRIBUTES[char.attribute] : null;
  const bc = borderColor ?? attrData?.color ?? '#00d4ff';
  const bg = bgColor ?? (attrData?.color ?? '#00d4ff') + '22';

  return (
    <View
      style={[
        avatarStyles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: bc,
          backgroundColor: bg,
          opacity: dimmed ? 0.45 : 1,
        },
      ]}
    >
      {img ? (
        <Image
          source={img}
          style={{ width: size * 0.8, height: size * 0.8 }}
          resizeMode="contain"
        />
      ) : (
        <Feather name="zap" size={size * 0.5} color={bc} />
      )}
    </View>
  );
}

const avatarStyles = StyleSheet.create({
  container: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

// ─── AttributeBadge ────────────────────────────────────────────────────────────
export function AttributeBadge({ attr }: { attr: AttributeId }) {
  const data = ATTRIBUTES[attr];
  return (
    <View style={[badgeStyles.badge, { backgroundColor: data.color + '33', borderColor: data.color }]}>
      <Text style={[badgeStyles.text, { color: data.color }]}>{data.abbr}</Text>
    </View>
  );
}

// ─── ElementBadge ──────────────────────────────────────────────────────────────
export function ElementBadge({ elem }: { elem: ElementId }) {
  const data = ELEMENTS[elem];
  return (
    <View style={[badgeStyles.badge, { backgroundColor: data.color + '33', borderColor: data.color }]}>
      <Text style={[badgeStyles.text, { color: data.color }]}>{data.label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  text: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.5 },
});

// ─── StatBar ───────────────────────────────────────────────────────────────────
export function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(1, value / max);
  return (
    <View style={statStyles.row}>
      <Text style={statStyles.label}>{label}</Text>
      <View style={statStyles.track}>
        <View style={[statStyles.fill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={statStyles.value}>{value}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  label: { width: 40, fontSize: 11, color: '#64748b', fontWeight: '600' as const },
  track: { flex: 1, height: 6, backgroundColor: '#1e3a5f', borderRadius: 3, overflow: 'hidden', marginHorizontal: 8 },
  fill: { height: '100%', borderRadius: 3 },
  value: { width: 36, fontSize: 12, color: '#e2e8f0', fontWeight: '700' as const, textAlign: 'right' },
});

// ─── CharacterCard ─────────────────────────────────────────────────────────────
interface CharacterCardProps {
  owned: OwnedCharacter;
  onPress?: () => void;
  isSelected?: boolean;
  compact?: boolean;
}

export function CharacterCard({ owned, onPress, isSelected, compact }: CharacterCardProps) {
  const colors = useColors();
  const char = CHARACTERS[owned.characterId];
  if (!char) return null;

  const scaled = getScaledStats(char.baseStats, owned.level);
  const expNeeded = expToNextLevel(owned.level);
  const expPct = Math.min(1, owned.exp / expNeeded);
  const rarityColor = RARITY_COLORS[char.rarity];

  if (compact) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        style={[
          cardStyles.compact,
          { backgroundColor: colors.card, borderColor: isSelected ? colors.primary : colors.border },
        ]}
      >
        <CharacterAvatar characterId={owned.characterId} size={52} />
        <Text style={[cardStyles.compactName, { color: colors.foreground }]} numberOfLines={1}>{char.name}</Text>
        <Text style={[cardStyles.compactLevel, { color: colors.primary }]}>Lv {owned.level}</Text>
        {isSelected && <View style={[cardStyles.selectedDot, { backgroundColor: colors.primary }]} />}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        cardStyles.card,
        { backgroundColor: colors.card, borderColor: isSelected ? colors.primary : colors.border },
      ]}
    >
      <View style={[cardStyles.topAccent, { backgroundColor: rarityColor }]} />
      <View style={cardStyles.header}>
        <CharacterAvatar characterId={owned.characterId} size={80} />
        <View style={[cardStyles.headerInfo, { marginLeft: 14 }]}>
          <Text style={[cardStyles.name, { color: colors.foreground }]}>{char.name}</Text>
          <Text style={[cardStyles.rarity, { color: rarityColor }]}>{RARITY_LABELS[char.rarity]}</Text>
          <View style={cardStyles.badges}>
            <AttributeBadge attr={char.attribute} />
            <View style={{ width: 6 }} />
            <ElementBadge elem={char.element} />
          </View>
        </View>
        <View style={cardStyles.levelBox}>
          <Text style={[cardStyles.levelLabel, { color: colors.mutedForeground }]}>LV</Text>
          <Text style={[cardStyles.levelNum, { color: colors.primary }]}>{owned.level}</Text>
        </View>
      </View>

      <View style={[cardStyles.divider, { backgroundColor: colors.border }]} />

      <View style={cardStyles.stats}>
        <StatBar label="HP"  value={scaled.hp}  max={300} color="#22c55e" />
        <StatBar label="ATK" value={scaled.atk} max={200} color="#ef4444" />
        <StatBar label="DEF" value={scaled.def} max={200} color="#3b82f6" />
        <StatBar label="SPT" value={scaled.spt} max={200} color="#a855f7" />
        <StatBar label="SPD" value={scaled.spd} max={150} color="#facc15" />
      </View>

      <View style={cardStyles.expRow}>
        <Text style={[cardStyles.expLabel, { color: colors.mutedForeground }]}>EXP</Text>
        <View style={[cardStyles.expTrack, { backgroundColor: colors.border }]}>
          <View style={[cardStyles.expFill, { width: `${expPct * 100}%` as any, backgroundColor: colors.primary }]} />
        </View>
        <Text style={[cardStyles.expText, { color: colors.mutedForeground }]}>{owned.exp}/{expNeeded}</Text>
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 14 },
  topAccent: { height: 3, width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  headerInfo: { flex: 1 },
  name: { fontSize: 20, fontWeight: '700' as const, marginBottom: 2 },
  rarity: { fontSize: 12, fontWeight: '600' as const, marginBottom: 8 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  levelBox: { alignItems: 'center' },
  levelLabel: { fontSize: 10, fontWeight: '600' as const },
  levelNum: { fontSize: 28, fontWeight: '800' as const },
  divider: { height: 1, marginHorizontal: 16 },
  stats: { padding: 16, paddingBottom: 8 },
  expRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14, gap: 8 },
  expLabel: { fontSize: 11, fontWeight: '600' as const, width: 30 },
  expTrack: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  expFill: { height: '100%', borderRadius: 2 },
  expText: { fontSize: 10, width: 60, textAlign: 'right' },
  compact: {
    width: 90, borderRadius: 12, borderWidth: 1.5,
    alignItems: 'center', padding: 10, marginRight: 10,
  },
  compactName: { fontSize: 12, fontWeight: '700' as const, textAlign: 'center', marginBottom: 2 },
  compactLevel: { fontSize: 11, fontWeight: '600' as const },
  selectedDot: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
});

// ─── ScanCard ──────────────────────────────────────────────────────────────────
interface ScanCardProps {
  characterId: string;
  scanPct: number;
  onCreate: () => void;
}

export function ScanCard({ characterId, scanPct, onCreate }: ScanCardProps) {
  const colors = useColors();
  const char = CHARACTERS[characterId];
  if (!char) return null;

  const rarityColor = RARITY_COLORS[char.rarity];
  const complete = scanPct >= 100;
  const pct = Math.min(100, scanPct);

  return (
    <View style={[scanStyles.card, { backgroundColor: colors.card, borderColor: complete ? colors.primary : colors.border }]}>
      <View style={[scanStyles.topAccent, { backgroundColor: rarityColor + (complete ? 'ff' : '55') }]} />
      <View style={scanStyles.header}>
        <CharacterAvatar characterId={characterId} size={80} dimmed={!complete} />
        <View style={[scanStyles.info, { marginLeft: 14 }]}>
          <Text style={[scanStyles.name, { color: complete ? colors.foreground : colors.mutedForeground }]}>{char.name}</Text>
          <Text style={[scanStyles.rarity, { color: rarityColor }]}>{RARITY_LABELS[char.rarity]}</Text>
          <View style={scanStyles.badges}>
            <AttributeBadge attr={char.attribute} />
            <View style={{ width: 6 }} />
            <ElementBadge elem={char.element} />
          </View>
        </View>
        <View style={scanStyles.pctBox}>
          <Text style={[scanStyles.pctNum, { color: complete ? colors.primary : colors.mutedForeground }]}>
            {Math.round(pct)}%
          </Text>
          <Text style={[scanStyles.pctLabel, { color: colors.mutedForeground }]}>scan</Text>
        </View>
      </View>

      <View style={[scanStyles.progressRow, { paddingHorizontal: 16, paddingBottom: complete ? 8 : 16 }]}>
        <View style={[scanStyles.track, { backgroundColor: colors.border }]}>
          <View style={[
            scanStyles.fill,
            { width: `${pct}%` as any, backgroundColor: complete ? colors.primary : '#3b82f6' },
          ]} />
        </View>
        <Text style={[scanStyles.trackLabel, { color: colors.mutedForeground }]}>
          {complete ? 'Scan completo!' : `${Math.round(pct)}/100`}
        </Text>
      </View>

      {complete && (
        <TouchableOpacity
          onPress={onCreate}
          activeOpacity={0.8}
          style={[scanStyles.createBtn, { backgroundColor: colors.primary, marginHorizontal: 16, marginBottom: 14 }]}
        >
          <Feather name="plus-circle" size={16} color={colors.primaryForeground} />
          <Text style={[scanStyles.createBtnText, { color: colors.primaryForeground }]}>Criar Digimon</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const scanStyles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 14 },
  topAccent: { height: 3, width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 12 },
  info: { flex: 1 },
  name: { fontSize: 20, fontWeight: '700' as const, marginBottom: 2 },
  rarity: { fontSize: 12, fontWeight: '600' as const, marginBottom: 8 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pctBox: { alignItems: 'center', minWidth: 52 },
  pctNum: { fontSize: 22, fontWeight: '800' as const },
  pctLabel: { fontSize: 10, fontWeight: '600' as const, marginTop: 2 },
  progressRow: { gap: 4 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  trackLabel: { fontSize: 11, textAlign: 'right' },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, paddingVertical: 12 },
  createBtnText: { fontSize: 15, fontWeight: '700' as const },
});

// ─── LockedCard ────────────────────────────────────────────────────────────────
interface LockedCardProps {
  hint: string;
  label?: string;
}

export function LockedCard({ hint, label = 'Evolução Especial' }: LockedCardProps) {
  const colors = useColors();
  return (
    <View style={[lockedStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[lockedStyles.topAccent, { backgroundColor: '#f59e0b55' }]} />
      <View style={lockedStyles.inner}>
        <View style={[lockedStyles.avatar, { borderColor: colors.border, backgroundColor: colors.muted }]}>
          <Feather name="lock" size={32} color={colors.mutedForeground} />
        </View>
        <View style={lockedStyles.info}>
          <Text style={[lockedStyles.label, { color: '#f59e0b' }]}>{label}</Text>
          <Text style={[lockedStyles.hint, { color: colors.mutedForeground }]}>{hint}</Text>
        </View>
      </View>
    </View>
  );
}

const lockedStyles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 14 },
  topAccent: { height: 3, width: '100%' },
  inner: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  label: { fontSize: 14, fontWeight: '700' as const, marginBottom: 6 },
  hint: { fontSize: 13, lineHeight: 18 },
});

// ─── HPBar ─────────────────────────────────────────────────────────────────────
export function HPBar({ current, max, color }: { current: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(1, current / max));
  const barColor = pct > 0.5 ? '#22c55e' : pct > 0.25 ? '#facc15' : '#ef4444';
  return (
    <View style={hpStyles.container}>
      <View style={[hpStyles.track, { borderColor: color + '44' }]}>
        <View style={[hpStyles.fill, { width: `${pct * 100}%` as any, backgroundColor: barColor }]} />
      </View>
      <Text style={[hpStyles.text, { color }]}>{current}/{max}</Text>
    </View>
  );
}

const hpStyles = StyleSheet.create({
  container: { width: '100%', gap: 4 },
  track: { height: 10, backgroundColor: '#1e3a5f', borderRadius: 5, borderWidth: 1, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
  text: { fontSize: 12, fontWeight: '700' as const, textAlign: 'center' },
});
