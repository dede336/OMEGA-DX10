import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Platform, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { TAMERS } from '@/constants/gameData';

const TK_CARD    = require('../../assets/images/tk_card.png');
const TAI_CARD   = require('../../assets/images/tai_card.png');

interface LeaderboardEntry {
  rank: number;
  username: string;
  tamerLevel: number;
  tamerName: string;
  collectionSize: number;
  tamerId: string | null;
  updatedAt: string;
}

const RANK_COLORS = ['#facc15', '#94a3b8', '#b87333'];
const RANK_ICONS = ['🥇', '🥈', '🥉'];

export default function RankingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token, user, getApiUrl } = useAuth();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [fetched, setFetched] = useState(false);

  const fetchLeaderboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const res = await fetch(`${getApiUrl()}/leaderboard?limit=50`);
      if (!res.ok) throw new Error('Erro ao carregar ranking');
      const json: LeaderboardEntry[] = await res.json();
      setData(json);
      setFetched(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro de conexão');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getApiUrl]);

  React.useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  function renderEntry({ item }: { item: LeaderboardEntry }) {
    const isMe = user?.username === item.username;
    const topRank = item.rank <= 3;
    const tamer = item.tamerId ? TAMERS.find((t) => t.id === item.tamerId) : null;
    const isTK  = item.tamerId === 'tamer_tk';
    const isTai = item.tamerId === 'tamer_tai';
    return (
      <View style={[
        styles.entry,
        {
          backgroundColor: isMe ? colors.primary + '18' : colors.card,
          borderColor: isMe ? colors.primary : topRank ? RANK_COLORS[item.rank - 1] + '88' : colors.border,
          borderWidth: isMe || topRank ? 1.5 : 1,
        },
      ]}>
        {isTK && (
          <Image
            source={TK_CARD}
            style={[StyleSheet.absoluteFillObject, { opacity: 0.55, borderRadius: 12 }]}
            resizeMode="cover"
          />
        )}
        {isTai && (
          <Image
            source={TAI_CARD}
            style={[StyleSheet.absoluteFillObject, { opacity: 0.55, borderRadius: 12 }]}
            resizeMode="cover"
          />
        )}
        <View style={styles.rankCol}>
          {topRank ? (
            <Text style={styles.rankEmoji}>{RANK_ICONS[item.rank - 1]}</Text>
          ) : (
            <Text style={[styles.rankNum, { color: colors.mutedForeground }]}>#{item.rank}</Text>
          )}
        </View>

        {/* Tamer avatar */}
        <View style={[styles.avatarWrap, { borderColor: tamer ? tamer.accentColor : colors.border }]}>
          {tamer ? (
            <Image
              source={tamer.image}
              style={[styles.avatarImg, { marginTop: tamer.avatarOffset, marginLeft: tamer.avatarOffsetX ?? 0 }]}
              resizeMode="cover"
            />
          ) : (
            <Feather name="user" size={20} color={colors.mutedForeground} />
          )}
        </View>

        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <Text style={[styles.tamerName, { color: colors.foreground }]} numberOfLines={1}>
              {item.tamerName}
            </Text>
            {isMe && (
              <View style={[styles.meBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.meBadgeText, { color: colors.primaryForeground }]}>Você</Text>
              </View>
            )}
          </View>
          <Text style={[styles.username, { color: colors.mutedForeground }]}>@{item.username}</Text>
        </View>
        <View style={styles.statsCol}>
          <Text style={[styles.levelText, { color: colors.primary }]}>Lv {item.tamerLevel}</Text>
          <Text style={[styles.collText, { color: colors.mutedForeground }]}>{item.collectionSize} 🐉</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>🏆 Ranking Global</Text>
        {!token && (
          <TouchableOpacity onPress={() => router.push('/login')} style={[styles.loginBtn, { borderColor: colors.primary }]}>
            <Feather name="log-in" size={14} color={colors.primary} />
            <Text style={[styles.loginBtnText, { color: colors.primary }]}>Entrar</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && !fetched ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Carregando ranking…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Feather name="wifi-off" size={40} color={colors.mutedForeground} />
          <Text style={[styles.errorText, { color: colors.mutedForeground }]}>{error}</Text>
          <TouchableOpacity onPress={() => fetchLeaderboard()} style={[styles.retryBtn, { borderColor: colors.border }]}>
            <Text style={{ color: colors.foreground }}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.username}
          renderItem={renderEntry}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 16 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchLeaderboard(true)} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Nenhum jogador ainda.{'\n'}Seja o primeiro a entrar!</Text>
            </View>
          }
          ListHeaderComponent={
            !token ? (
              <View style={[styles.loginBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="info" size={16} color={colors.mutedForeground} />
                <Text style={[styles.bannerText, { color: colors.mutedForeground }]}>
                  Entre na sua conta para aparecer no ranking e salvar seu progresso na nuvem
                </Text>
                <TouchableOpacity onPress={() => router.push('/login')} style={[styles.bannerBtn, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.bannerBtnText, { color: colors.primaryForeground }]}>Entrar / Criar conta</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: '900' as const },
  loginBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  loginBtnText: { fontSize: 13, fontWeight: '700' as const },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 80 },
  loadingText: { fontSize: 14 },
  errorText: { fontSize: 14, textAlign: 'center' },
  retryBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 24 },
  list: { padding: 16, gap: 10 },
  entry: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, gap: 10, overflow: 'hidden' as const },
  rankCol: { width: 32, alignItems: 'center' },
  avatarWrap: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, overflow: 'hidden' as const, backgroundColor: '#0f1629' },
  avatarImg: { width: 44, height: 100 },
  rankEmoji: { fontSize: 22 },
  rankNum: { fontSize: 14, fontWeight: '700' as const },
  infoCol: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tamerName: { fontSize: 15, fontWeight: '700' as const, flexShrink: 1 },
  meBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  meBadgeText: { fontSize: 10, fontWeight: '800' as const },
  username: { fontSize: 12 },
  statsCol: { alignItems: 'flex-end', gap: 2 },
  levelText: { fontSize: 15, fontWeight: '800' as const },
  collText: { fontSize: 12 },
  loginBanner: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10, marginBottom: 8, alignItems: 'flex-start' },
  bannerText: { fontSize: 13, lineHeight: 18 },
  bannerBtn: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  bannerBtnText: { fontSize: 13, fontWeight: '700' as const },
});
