import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';

type Mode = 'login' | 'register';

const logoSource  = require('../assets/images/logo.png');

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, register, getApiUrl } = useAuth();
  const { loadFromCloud } = useGame();
  const [mode, setMode]       = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  async function handleSubmit() {
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Preencha todos os campos');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(username.trim(), password);
        await loadFromCloud(getApiUrl());
      } else {
        await register(username.trim(), password);
      }
      router.replace('/intro' as never);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoArea}>
            <Image source={logoSource} style={styles.logo} contentFit="contain" />
            <Text style={styles.tagline}>Sua aventura começa aqui</Text>
          </View>

          {/* Toggle */}
          <View style={styles.toggle}>
            {(['login', 'register'] as Mode[]).map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => { setMode(m); setError(''); }}
                style={[styles.toggleBtn, mode === m && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>
                  {m === 'login' ? 'Entrar' : 'Criar conta'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Fields */}
          <View style={styles.fields}>
            <View style={styles.inputWrapper}>
              <Feather name="user" size={18} color="#9ca3af" />
              <TextInput
                style={styles.input}
                placeholder="Nome de usuário"
                placeholderTextColor="#6b7280"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Feather name="lock" size={18} color="#9ca3af" />
              <TextInput
                style={styles.input}
                placeholder="Senha (mín. 6 caracteres)"
                placeholderTextColor="#6b7280"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPw((p) => !p)}>
                <Feather name={showPw ? 'eye-off' : 'eye'} size={18} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {error !== '' && (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={14} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleSubmit}
              activeOpacity={loading ? 1 : 0.8}
              style={[styles.submitBtn, loading && styles.submitBtnLoading]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>
                  {mode === 'login' ? 'ENTRAR' : 'CRIAR CONTA'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {mode === 'register' && (
            <Text style={styles.hint}>
              Username: 3–20 caracteres, apenas letras, números e _
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:              { flex: 1, backgroundColor: '#0a0a0f' },
  flex:              { flex: 1 },
  container:         { flexGrow: 1, paddingHorizontal: 28, gap: 28 },

  logoArea:          { alignItems: 'center', gap: 10, paddingTop: 12 },
  logo:              { width: 220, height: 110 },
  tagline:           { fontSize: 14, color: '#6b7280', letterSpacing: 0.5 },

  toggle:            { flexDirection: 'row', backgroundColor: '#1a1a2e', borderRadius: 14, padding: 4, gap: 4 },
  toggleBtn:         { flex: 1, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  toggleBtnActive:   { backgroundColor: '#3b82f6' },
  toggleText:        { fontSize: 14, fontWeight: '700' as const, color: '#6b7280' },
  toggleTextActive:  { color: '#ffffff' },

  fields:            { gap: 14 },
  inputWrapper:      {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  input:             { flex: 1, fontSize: 15, color: '#f3f4f6' },
  errorBox:          {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ef444422',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 10,
    padding: 12,
  },
  errorText:         { flex: 1, fontSize: 13, color: '#ef4444' },
  submitBtn:         { backgroundColor: '#3b82f6', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitBtnLoading:  { backgroundColor: '#3b82f688' },
  submitText:        { fontSize: 16, fontWeight: '900' as const, color: '#ffffff', letterSpacing: 1 },
  hint:              { fontSize: 12, textAlign: 'center', color: '#6b7280' },
});
