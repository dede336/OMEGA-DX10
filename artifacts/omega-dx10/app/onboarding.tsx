import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useGame } from '@/context/GameContext';
import { TAMERS } from '@/constants/gameData';
import type { TamerGender } from '@/constants/gameData';

const TOTAL_STEPS = 3;

const GENDER_OPTIONS: { id: TamerGender; label: string; icon: string; color: string }[] = [
  { id: 'M', label: 'Masculino', icon: '♂', color: '#3b82f6' },
  { id: 'F', label: 'Feminino',  icon: '♀', color: '#ec4899' },
  { id: 'N', label: 'Neutro',    icon: '⚧', color: '#8b5cf6' },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useGame();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<TamerGender | null>(null);
  const [tamerId, setTamerId] = useState<string | null>(null);
  const [nameError, setNameError] = useState('');

  const fadeAnim = useRef(new Animated.Value(1)).current;

  function animateStep(nextStep: number) {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setTimeout(() => setStep(nextStep), 150);
  }

  function handleNext() {
    if (step === 0) {
      const trimmed = name.trim();
      if (trimmed.length < 2) {
        setNameError('O nome precisa ter pelo menos 2 caracteres.');
        return;
      }
      if (trimmed.length > 16) {
        setNameError('O nome pode ter no máximo 16 caracteres.');
        return;
      }
      setNameError('');
      animateStep(1);
    } else if (step === 1) {
      if (!gender) return;
      animateStep(2);
    } else if (step === 2) {
      if (!tamerId || !gender) return;
      completeOnboarding(name.trim(), gender, tamerId);
      router.replace('/(tabs)' as never);
    }
  }

  function handleBack() {
    if (step > 0) animateStep(step - 1);
  }

  const canNext =
    (step === 0 && name.trim().length >= 2) ||
    (step === 1 && gender !== null) ||
    (step === 2 && tamerId !== null);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

        {/* Header: back + progress */}
        <View style={styles.topBar}>
          {step > 0 ? (
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <Feather name="arrow-left" size={22} color="#94a3b8" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}
          <View style={styles.dots}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === step && styles.dotActive,
                  i < step && styles.dotDone,
                ]}
              />
            ))}
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Content */}
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {step === 0 && (
            <View style={styles.stepContainer}>
              <Image
                source={require('../assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.stepTitle}>Bem-vindo, Tamer!</Text>
              <Text style={styles.stepSubtitle}>Antes de começar, como você quer ser chamado?</Text>
              <View style={styles.inputWrapper}>
                <Feather name="user" size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Seu nome de Tamer"
                  placeholderTextColor="#475569"
                  value={name}
                  onChangeText={(t) => { setName(t); setNameError(''); }}
                  maxLength={16}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleNext}
                />
                <Text style={styles.charCount}>{name.length}/16</Text>
              </View>
              {nameError ? (
                <Text style={styles.errorText}>{nameError}</Text>
              ) : null}
            </View>
          )}

          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepEmoji}>👤</Text>
              <Text style={styles.stepTitle}>Olá, {name}!</Text>
              <Text style={styles.stepSubtitle}>Como você se identifica?</Text>
              <View style={styles.genderGrid}>
                {GENDER_OPTIONS.map((g) => {
                  const selected = gender === g.id;
                  return (
                    <TouchableOpacity
                      key={g.id}
                      style={[
                        styles.genderCard,
                        selected && { borderColor: g.color, backgroundColor: g.color + '22' },
                      ]}
                      onPress={() => setGender(g.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.genderIcon, selected && { color: g.color }]}>{g.icon}</Text>
                      <Text style={[styles.genderLabel, selected && { color: g.color }]}>{g.label}</Text>
                      {selected && (
                        <View style={[styles.genderCheck, { backgroundColor: g.color }]}>
                          <Feather name="check" size={10} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepEmoji}>🧢</Text>
              <Text style={styles.stepTitle}>Escolha seu Tamer</Text>
              <Text style={styles.stepSubtitle}>Selecione o estilo que representa você na batalha.</Text>
              <ScrollView
                style={styles.tamerList}
                contentContainerStyle={styles.tamerListContent}
                showsVerticalScrollIndicator={false}
              >
                {TAMERS.map((t) => {
                  const selected = tamerId === t.id;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={[
                        styles.tamerCard,
                        selected && { borderColor: t.accentColor, backgroundColor: t.accentColor + '18' },
                      ]}
                      onPress={() => setTamerId(t.id)}
                      activeOpacity={0.8}
                    >
                      {/* Placeholder avatar until user sends images */}
                      <View style={[styles.tamerAvatar, { backgroundColor: t.accentColor + '33', borderColor: t.accentColor + '88' }]}>
                        <Feather name="user" size={28} color={t.accentColor} />
                        <Text style={styles.tamerAvatarHint}>Em breve</Text>
                      </View>
                      <View style={styles.tamerInfo}>
                        <Text style={[styles.tamerName, selected && { color: t.accentColor }]}>{t.name}</Text>
                        <Text style={styles.tamerDesc}>{t.description}</Text>
                      </View>
                      {selected && (
                        <View style={[styles.tamerCheck, { backgroundColor: t.accentColor }]}>
                          <Feather name="check" size={14} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </Animated.View>

        {/* Next button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextBtn, !canNext && styles.nextBtnDisabled]}
            onPress={handleNext}
            activeOpacity={canNext ? 0.85 : 1}
          >
            <Text style={[styles.nextBtnText, !canNext && styles.nextBtnTextDisabled]}>
              {step < TOTAL_STEPS - 1 ? 'Continuar' : 'Começar Aventura'}
            </Text>
            <Feather
              name={step < TOTAL_STEPS - 1 ? 'arrow-right' : 'zap'}
              size={18}
              color={canNext ? '#ffffff' : '#475569'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: { padding: 4 },
  dots: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1e293b' },
  dotActive: { width: 24, backgroundColor: '#6366f1' },
  dotDone: { backgroundColor: '#22c55e' },

  content: { flex: 1, paddingHorizontal: 24 },

  stepContainer: { flex: 1, alignItems: 'center', paddingTop: 16 },

  logo: { width: 200, height: 80, marginBottom: 24 },

  stepEmoji: { fontSize: 56, marginBottom: 16 },
  stepTitle: { fontSize: 26, fontWeight: '800' as const, color: '#f1f5f9', textAlign: 'center', marginBottom: 8 },
  stepSubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 32 },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderWidth: 1.5,
    borderColor: '#1e293b',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
    width: '100%',
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 17,
    color: '#f1f5f9',
    paddingVertical: 14,
    fontWeight: '600' as const,
  },
  charCount: { fontSize: 11, color: '#475569' },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 8, alignSelf: 'flex-start' },

  genderGrid: { flexDirection: 'row', gap: 12, width: '100%' },
  genderCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#1e293b',
    backgroundColor: '#111827',
    paddingVertical: 28,
    gap: 8,
    position: 'relative' as const,
  },
  genderIcon: { fontSize: 36, color: '#94a3b8' },
  genderLabel: { fontSize: 13, fontWeight: '700' as const, color: '#94a3b8' },
  genderCheck: { position: 'absolute' as const, top: 8, right: 8, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },

  tamerList: { width: '100%', flex: 1 },
  tamerListContent: { gap: 12, paddingBottom: 20 },
  tamerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1.5,
    borderColor: '#1e293b',
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 14,
    position: 'relative' as const,
  },
  tamerAvatar: {
    width: 70,
    height: 70,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tamerAvatarHint: { fontSize: 8, color: '#64748b', fontWeight: '600' as const },
  tamerInfo: { flex: 1, gap: 4 },
  tamerName: { fontSize: 17, fontWeight: '800' as const, color: '#f1f5f9' },
  tamerDesc: { fontSize: 12, color: '#64748b', lineHeight: 16 },
  tamerCheck: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },

  footer: { paddingHorizontal: 24, paddingBottom: 8, paddingTop: 12 },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#6366f1',
    borderRadius: 16,
    paddingVertical: 18,
  },
  nextBtnDisabled: { backgroundColor: '#1e293b' },
  nextBtnText: { fontSize: 16, fontWeight: '700' as const, color: '#ffffff' },
  nextBtnTextDisabled: { color: '#475569' },
});
