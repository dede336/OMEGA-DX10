import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";
import { Platform, StyleSheet, View, Image, useColorScheme } from "react-native";

import { useColors } from "@/hooks/useColors";
import { useGame } from "@/context/GameContext";

const HOME_ICON     = require('../../assets/images/home-icon.png');
const DIGIBANK_ICON = require('../../assets/images/digibank-icon.png');
const CRAFT_ICON    = require('../../assets/images/craft-icon.png');
const MAP_ICON      = require('../../assets/images/map-icon.png');
const MAIL_ICON     = require('../../assets/images/mailbox-icon.png');
const TROPHY_ICON   = require('../../assets/images/trophy-icon.png');

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Início</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="collection">
        <Icon sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }} />
        <Label>Digibank</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="craft">
        <Icon sf={{ default: "hammer", selected: "hammer.fill" }} />
        <Label>Craft</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="map">
        <Icon sf={{ default: "map", selected: "map.fill" }} />
        <Label>Mundo</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="correios">
        <Icon sf={{ default: "envelope", selected: "envelope.fill" }} />
        <Label>Correios</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="ranking">
        <Icon sf={{ default: "trophy", selected: "trophy.fill" }} />
        <Label>Ranking</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const { unreadMailCount } = useGame();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarPosition: "top",
        tabBarIconStyle: { marginBottom: 0 },
        tabBarLabelStyle: { fontSize: 10, marginTop: 2 },
        tabBarItemStyle: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
        tabBarStyle: {
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          elevation: 0,
          height: isWeb ? 84 : 60,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: () => (
            <Image source={HOME_ICON} style={{ width: 26, height: 26 }} resizeMode="contain" />
          ),
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: "Digibank",
          tabBarIcon: () => (
            <Image source={DIGIBANK_ICON} style={{ width: 28, height: 28 }} resizeMode="contain" />
          ),
        }}
      />
      <Tabs.Screen
        name="mochila"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="craft"
        options={{
          title: "Craft",
          tabBarIcon: () => (
            <Image source={CRAFT_ICON} style={{ width: 26, height: 26 }} resizeMode="contain" />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Mundo",
          tabBarIcon: () => (
            <Image source={MAP_ICON} style={{ width: 26, height: 26 }} resizeMode="contain" />
          ),
        }}
      />
      <Tabs.Screen
        name="correios"
        options={{
          title: "Correios",
          tabBarBadge: unreadMailCount > 0 ? unreadMailCount : undefined,
          tabBarIcon: () => (
            <Image source={MAIL_ICON} style={{ width: 28, height: 28 }} resizeMode="contain" />
          ),
        }}
      />
      <Tabs.Screen
        name="ranking"
        options={{
          title: "Ranking",
          tabBarIcon: () => (
            <Image source={TROPHY_ICON} style={{ width: 28, height: 28 }} resizeMode="contain" />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
