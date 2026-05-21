import { useColorScheme } from "react-native";

import colors from "@/constants/colors";
import { getTamerTheme } from "@/hooks/tamerTheme";

export function useColors() {
  const scheme = useColorScheme();
  const palette =
    scheme === "dark" && "dark" in colors
      ? (colors as Record<string, typeof colors.light>).dark
      : colors.light;

  const { primary, primaryForeground } = getTamerTheme();
  if (primary) {
    return { ...palette, primary, primaryForeground, radius: colors.radius };
  }

  return { ...palette, radius: colors.radius };
}
