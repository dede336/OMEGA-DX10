import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';

type Mode = 'login' | 'register';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, register, getApiUrl } = useAuth();
  const { loadFromCloud } = useGame();
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit() {
    setError('');
    if (!username.trim() || !password.trim()) { setError('Preencha todos os campos'); return; }
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(username.trim(), password);
        await loadFromCloud(getApiUrl());
      } else {
        await register(username.trim(), password);
      }
      router.replace('/(tabs)');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Jogar offline</Text>
        </TouchableOpacity>

        {/* Logo area */}
        <View style={styles.logoArea}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}>
            <Feather name="globe" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>OMEGA DX10 Online</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {mode === 'login' ? 'Entre na sua conta para salvar na nuvem e ver o ranking' : 'Crie sua conta para jogar online'}
          </Text>
        </View>

        {/* Toggle */}
        <View style={[styles.toggle, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {(['login', 'register'] as Mode[]).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => { setMode(m); setError(''); }}
              style={[styles.toggleBtn, mode === m && { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.toggleText, { color: mode === m ? colors.primaryForeground : colors.mutedForeground }]}>
                {m === 'login' ? 'Entrar' : 'Criar conta'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Fields */}
        <View style={styles.fields}>
          <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Feather name="user" size={18} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Username"
              placeholderTextColor={colors.mutedForeground}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
          </View>

          <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Feather name="lock" size={18} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Senha (mín. 6 caracteres)"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPw((p) => !p)}>
              <Feather name={showPw ? 'eye-off' : 'eye'} size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {error !== '' && (
            <View style={[styles.errorBox, { backgroundColor: '#ef444422', borderColor: '#ef4444' }]}>
              <Feather name="alert-circle" size={14} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={loading ? 1 : 0.8}
            style={[styles.submitBtn, { backgroundColor: loading ? colors.primary + '88' : colors.primary }]}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
                {mode === 'login' ? 'Entrar' : 'Criar conta'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {mode === 'register' && (
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Username: 3–20 chars, apenas letras, números e _
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 24, gap: 24 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backText: { fontSize: 14, fontWeight: '600' as const },
  logoArea: { alignItems: 'center', gap: 14, paddingVertical: 8 },
  logoCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '900' as const, textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  toggle: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 4, gap: 4 },
  toggleBtn: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  toggleText: { fontSize: 14, fontWeight: '700' as const },
  fields: { gap: 12 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14 },
  input: { flex: 1, fontSize: 15 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, padding: 12 },
  errorText: { flex: 1, fontSize: 13, color: '#ef4444' },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitText: { fontSize: 16, fontWeight: '800' as const },
  hint: { fontSize: 12, textAlign: 'center' },
});
