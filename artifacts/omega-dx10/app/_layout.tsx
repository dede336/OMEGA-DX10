import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GameProvider, useGame } from "@/context/GameContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { TamerThemeProvider, useTamerTheme } from "@/context/TamerThemeContext";
import { useCloudSync } from "@/hooks/useCloudSync";
import { TAMERS } from "@/constants/gameData";

SplashScreen.preventAutoHideAsync();
SplashScreen.hideAsync();

const queryClient = new QueryClient();

const LIGHT_TAMER_COLORS = new Set(['#eab308']);

function TamerThemeSyncer() {
  const { tamerId } = useGame();
  const { setTheme } = useTamerTheme();
  useEffect(() => {
    const tamer = tamerId ? TAMERS.find((t) => t.id === tamerId) : null;
    if (tamer) {
      setTheme({
        primary: tamer.accentColor,
        primaryForeground: LIGHT_TAMER_COLORS.has(tamer.accentColor) ? '#0f172a' : '#ffffff',
      });
    }
  }, [tamerId, setTheme]);
  return null;
}

function NavigationGuard() {
  const { isLoaded } = useGame();
  const { isAuthLoaded, user } = useAuth();
  const fired = useRef(false);
  useEffect(() => {
    if (!isLoaded || !isAuthLoaded || fired.current) return;
    fired.current = true;
    if (!user) {
      router.replace('/login' as never);
    } else {
      router.replace('/intro' as never);
    }
  }, [isLoaded, isAuthLoaded, user]);
  return null;
}

function CloudSyncManager() {
  useCloudSync();
  return null;
}

function RootLayoutNav() {
  return (
    <>
      <TamerThemeSyncer />
      <NavigationGuard />
      <CloudSyncManager />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="intro" options={{ headerShown: false, gestureEnabled: false, animation: 'none' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="battle" options={{ headerShown: false, presentation: "fullScreenModal" }} />
        <Stack.Screen name="character/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false, gestureEnabled: false, animation: 'none' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <TamerThemeProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <GameProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <KeyboardProvider>
                    <RootLayoutNav />
                  </KeyboardProvider>
                </GestureHandlerRootView>
              </GameProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </TamerThemeProvider>
    </SafeAreaProvider>
  );
}
