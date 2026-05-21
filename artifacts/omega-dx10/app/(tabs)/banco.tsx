import React, { useMemo, useState } from 'react';
import {
  FlatList, Platform, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useGame } from '@/context/GameContext';
import { useColors } from '@/hooks/useColors';
import {
  CHARACTERS, CODEX_ORDER, EVOLUTIONS, ALTERNATE_EVOLUTIONS, FUSIONS,
  SCANNABLE_CHARACTERS, RARITY_COLORS, RARITY_LABELS, ATTRIBUTES, ELEMENTS,
} from '@/constants/gameData';
import { CharacterAvatar } from '@/components/GameComponents';

// ─── Obtain data ────────────────────────────────────────────────────────────

const MAIL_REWARDS: Record<string, number> = {
  guilmon: 5,
  agumonSaver: 10,
};

const STARTER_TAMERS: Record<string, string> = {
  agumon:  'Tai',
  patamon: 'T.K.',
  gabumon: 'Matt',
  salamon: 'Kari',
  pyomon:  'Sora',
  palmon:  'Mimi',
};

type ObtainMethod =
  | { type: 'starter'; tamer: string }
  | { type: 'scan' }
  | { type: 'mail'; rank: number }
  | { type: 'evolution'; from: string; level: number; item?: string }
  | { type: 'altEvo'; from: string; level: number; sacrifice?: string; item?: string }
  | { type: 'fusion'; a: string; b: string; level: number };

function getObtainMethods(charId: string): ObtainMethod[] {
  const methods: ObtainMethod[] = [];

  if (STARTER_TAMERS[charId]) {
    methods.push({ type: 'starter', tamer: STARTER_TAMERS[charId] });
  }
  if (SCANNABLE_CHARACTERS.includes(charId)) {
    methods.push({ type: 'scan' });
  }
  if (MAIL_REWARDS[charId] !== undefined) {
    methods.push({ type: 'mail', rank: MAIL_REWARDS[charId] });
  }
  for (const [fromId, evo] of Object.entries(EVOLUTIONS)) {
    if (evo.evolvesTo === charId) {
      methods.push({ type: 'evolution', from: fromId, level: evo.requiredLevel, item: evo.requiredItem });
    }
  }
  for (const [fromId, altEvo] of Object.entries(ALTERNATE_EVOLUTIONS)) {
    if (altEvo.evolvesTo === charId) {
      methods.push({ type: 'altEvo', from: fromId, level: altEvo.requiredLevel, sacrifice: altEvo.requiredSacrificeCharacter, item: altEvo.requiredItem });
    }
  }
  const fusionSeen = new Set<string>();
  for (const [, fusion] of Object.entries(FUSIONS)) {
    if (fusion.resultId === charId) {
      const key = [fusion.partner, ...Object.keys(FUSIONS).filter(k => FUSIONS[k].resultId === charId && FUSIONS[k].partner !== fusion.partner)].sort().join('-');
      if (!fusionSeen.has(key)) {
        fusionSeen.add(key);
        const partnerA = Object.entries(FUSIONS).find(([, f]) => f.resultId === charId);
        if (partnerA) {
          methods.push({ type: 'fusion', a: partnerA[0], b: partnerA[1].partner, level: partnerA[1].requiredLevel });
        }
        break;
      }
    }
  }
  return methods;
}

function renderMethodLabel(m: ObtainMethod): { icon: string; label: string; color: string } {
  switch (m.type) {
    case 'starter':
      return { icon: '🌟', label: `Inicial do Tamer ${m.tamer}`, color: '#f59e0b' };
    case 'scan':
      return { icon: '📡', label: 'Escaneie em batalha', color: '#22c55e' };
    case 'mail':
      return { icon: '📬', label: `Correio — Tamer Rank ${m.rank}`, color: '#a78bfa' };
    case 'evolution': {
      const fromName = CHARACTERS[m.from]?.name ?? m.from;
      const extra = m.item ? ` + Item` : '';
      return { icon: '⬆️', label: `Evolução de ${fromName} (Lv ${m.level})${extra}`, color: '#60a5fa' };
    }
    case 'altEvo': {
      const fromName = CHARACTERS[m.from]?.name ?? m.from;
      const sacrificeName = m.sacrifice ? (CHARACTERS[m.sacrifice]?.name ?? m.sacrifice) : null;
      const itemLabel = m.item ? ' + Item Especial' : '';
      const sacLabel = sacrificeName ? ` + Sacrificar ${sacrificeName}` : '';
      return { icon: '✨', label: `Evolução Alt. de ${fromName} (Lv ${m.level})${sacLabel}${itemLabel}`, color: '#fb923c' };
    }
    case 'fusion': {
      const aName = CHARACTERS[m.a]?.name ?? m.a;
      const bName = CHARACTERS[m.b]?.name ?? m.b;
      return { icon: '🔀', label: `Fusão: ${aName} + ${bName} (Lv ${m.level})`, color: '#e879f9' };
    }
  }
}

// ─── Filter ─────────────────────────────────────────────────────────────────

type Filter = 'all' | 'owned' | 'missing' | 'available' | 'unavailable';

const FILTER_LABELS: { key: Filter; label: string }[] = [
  { key: 'all',         label: 'Todos'        },
  { key: 'owned',       label: 'Obtidos'      },
  { key: 'missing',     label: 'Faltam'       },
  { key: 'available',   label: 'Disponíveis'  },
  { key: 'unavailable', label: 'Indisponíveis'},
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function BancoScreen() {
  const colors = useColors();
  const { collection } = useGame();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const ownedSet = useMemo(
    () => new Set(collection.map((c) => c.characterId)),
    [collection],
  );

  const entries = useMemo(() => {
    return CODEX_ORDER.map((id) => {
      const char = CHARACTERS[id];
      if (!char) return null;
      const methods = getObtainMethods(id);
      const isOwned = ownedSet.has(id);
      const isAvailable = methods.length > 0;
      return { id, char, methods, isOwned, isAvailable };
    }).filter(Boolean) as {
      id: string;
      char: (typeof CHARACTERS)[string];
      methods: ObtainMethod[];
      isOwned: boolean;
      isAvailable: boolean;
    }[];
  }, [ownedSet]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (q && !e.char.name.toLowerCase().includes(q)) return false;
      if (filter === 'owned' && !e.isOwned) return false;
      if (filter === 'missing' && e.isOwned) return false;
      if (filter === 'available' && (!e.isAvailable || e.isOwned)) return false;
      if (filter === 'unavailable' && e.isAvailable) return false;
      return true;
    });
  }, [entries, search, filter]);

  const st = styles(colors);

  return (
    <View style={st.root}>
      {/* Search */}
      <View style={st.searchRow}>
        <Feather name="search" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
        <TextInput
          style={st.searchInput}
          placeholder="Buscar Digimon..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={st.filterRow}>
        {FILTER_LABELS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[st.filterChip, filter === key && { backgroundColor: colors.primary }]}
            onPress={() => setFilter(key)}
          >
            <Text style={[st.filterText, { color: filter === key ? '#fff' : colors.mutedForeground }]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Count */}
      <Text style={[st.countText, { color: colors.mutedForeground }]}>
        {ownedSet.size}/{CODEX_ORDER.length} obtidos · {filtered.length} mostrados
      </Text>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
        renderItem={({ item }) => {
          const rarity = item.char.rarity as keyof typeof RARITY_COLORS;
          const rarityColor = RARITY_COLORS[rarity] ?? '#888';
          const isExpanded = expanded === item.id;

          return (
            <TouchableOpacity
              style={[
                st.card,
                { borderColor: item.isOwned ? rarityColor : colors.border, borderWidth: item.isOwned ? 2 : 1 },
              ]}
              onPress={() => setExpanded(isExpanded ? null : item.id)}
              activeOpacity={0.8}
            >
              {/* Top accent */}
              <View style={[st.topAccent, { backgroundColor: rarityColor }]} />

              {/* Main row */}
              <View style={st.mainRow}>
                <View style={[st.avatarWrap, !item.isOwned && st.avatarGray]}>
                  <CharacterAvatar characterId={item.id} size={56} />
                </View>

                <View style={st.info}>
                  <View style={st.nameRow}>
                    <Text style={[st.name, { color: colors.foreground }]} numberOfLines={1}>
                      {item.char.name}
                    </Text>
                    <View style={[st.rarityBadge, { backgroundColor: rarityColor + '33', borderColor: rarityColor }]}>
                      <Text style={[st.rarityText, { color: rarityColor }]}>{RARITY_LABELS[rarity]}</Text>
                    </View>
                  </View>

                  <View style={st.badgeRow}>
                    <View style={[st.attrBadge, { backgroundColor: ATTRIBUTES[item.char.attribute as keyof typeof ATTRIBUTES]?.color + '33' }]}>
                      <Text style={[st.attrText, { color: ATTRIBUTES[item.char.attribute as keyof typeof ATTRIBUTES]?.color ?? '#888' }]}>
                        {ATTRIBUTES[item.char.attribute as keyof typeof ATTRIBUTES]?.label ?? item.char.attribute}
                      </Text>
                    </View>
                    <View style={[st.elemBadge, { backgroundColor: ELEMENTS[item.char.element as keyof typeof ELEMENTS]?.color + '33' }]}>
                      <Text style={[st.elemText, { color: ELEMENTS[item.char.element as keyof typeof ELEMENTS]?.color ?? '#888' }]}>
                        {ELEMENTS[item.char.element as keyof typeof ELEMENTS]?.label ?? item.char.element}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Status badge */}
                <View style={[st.statusBadge, { backgroundColor: item.isOwned ? '#22c55e22' : '#88888822' }]}>
                  <Text style={{ fontSize: 16 }}>{item.isOwned ? '✅' : '🔒'}</Text>
                </View>
              </View>

              {/* Expanded: obtain methods */}
              {isExpanded && (
                <View style={st.methodsBlock}>
                  <View style={[st.divider, { backgroundColor: colors.border }]} />
                  {item.methods.length === 0 ? (
                    <View style={st.methodRow}>
                      <Text style={st.methodIcon}>🚫</Text>
                      <Text style={[st.methodLabel, { color: colors.mutedForeground }]}>
                        Não disponível no momento
                      </Text>
                    </View>
                  ) : (
                    item.methods.map((m, i) => {
                      const { icon, label, color } = renderMethodLabel(m);
                      return (
                        <View key={i} style={st.methodRow}>
                          <Text style={st.methodIcon}>{icon}</Text>
                          <Text style={[st.methodLabel, { color }]} numberOfLines={2}>{label}</Text>
                        </View>
                      );
                    })
                  )}

                  {/* Description */}
                  <Text style={[st.description, { color: colors.mutedForeground }]}>
                    {item.char.description}
                  </Text>
                </View>
              )}

              {/* Collapse hint */}
              <View style={st.chevronRow}>
                <Feather
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={colors.mutedForeground}
                />
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

function styles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: Platform.OS === 'ios' ? 54 : 16,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 10,
      marginHorizontal: 12,
      marginBottom: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      color: colors.foreground,
      fontSize: 14,
      padding: 0,
    },
    filterRow: {
      flexDirection: 'row',
      paddingHorizontal: 12,
      gap: 6,
      marginBottom: 6,
      flexWrap: 'wrap',
    },
    filterChip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterText: {
      fontSize: 11,
      fontWeight: '600',
    },
    countText: {
      fontSize: 11,
      paddingHorizontal: 14,
      marginBottom: 4,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      marginBottom: 10,
      overflow: 'hidden',
    },
    topAccent: {
      height: 3,
      width: '100%',
    },
    mainRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      gap: 10,
    },
    avatarWrap: {
      borderRadius: 8,
      overflow: 'hidden',
    },
    avatarGray: {
      opacity: 0.35,
    },
    info: {
      flex: 1,
      gap: 5,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    name: {
      fontSize: 14,
      fontWeight: '700',
    },
    rarityBadge: {
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 4,
      borderWidth: 1,
    },
    rarityText: {
      fontSize: 10,
      fontWeight: '700',
    },
    badgeRow: {
      flexDirection: 'row',
      gap: 5,
    },
    attrBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    attrText: {
      fontSize: 10,
      fontWeight: '600',
    },
    elemBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    elemText: {
      fontSize: 10,
      fontWeight: '600',
    },
    statusBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    methodsBlock: {
      paddingHorizontal: 14,
      paddingBottom: 12,
      gap: 6,
    },
    divider: {
      height: 1,
      marginBottom: 8,
    },
    methodRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
    },
    methodIcon: {
      fontSize: 14,
      lineHeight: 20,
    },
    methodLabel: {
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 20,
      flex: 1,
    },
    description: {
      fontSize: 11,
      lineHeight: 16,
      marginTop: 6,
      fontStyle: 'italic',
    },
    chevronRow: {
      alignItems: 'center',
      paddingBottom: 6,
    },
  });
}
