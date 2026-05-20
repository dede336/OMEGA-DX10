import React, { useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useGame } from '@/context/GameContext';

const { width, height } = Dimensions.get('window');
const useND = Platform.OS !== 'web';

const videoSource = require('../assets/videos/intro.mp4');
const logoSource = require('../assets/images/logo.png');

export default function IntroScreen() {
  const { isLoaded, isOnboarded } = useGame();

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale   = useRef(new Animated.Value(0.7)).current;

  const navigateAway = useCallback(() => {
    Animated.timing(logoOpacity, { toValue: 0, duration: 400, useNativeDriver: useND }).start(() => {
      if (isLoaded && !isOnboarded) {
        router.replace('/onboarding' as never);
      } else {
        router.replace('/(tabs)' as never);
      }
    });
  }, [isLoaded, isOnboarded, logoOpacity]);

  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = false;
    p.muted = false;
    p.play();
  });

  // Navigate when video ends
  useEffect(() => {
    const sub = player.addListener('playingChange', (event) => {
      if (!event.isPlaying && player.currentTime > 0) {
        navigateAway();
      }
    });
    return () => sub.remove();
  }, [player, navigateAway]);

  // Fade logo in after 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 700, useNativeDriver: useND }),
        Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: useND }),
      ]).start();
    }, 400);
    return () => clearTimeout(timer);
  }, [logoOpacity, logoScale]);

  // Safety fallback: navigate after 8 seconds regardless
  useEffect(() => {
    const fallback = setTimeout(() => navigateAway(), 8000);
    return () => clearTimeout(fallback);
  }, [navigateAway]);

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
      />

      <View style={styles.overlay} pointerEvents="none">
        <Animated.View
          style={[
            styles.logoWrapper,
            { opacity: logoOpacity, transform: [{ scale: logoScale }] },
          ]}
        >
          <Image source={logoSource} style={styles.logo} contentFit="contain" />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width,
    height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 260,
    height: 110,
  },
});
