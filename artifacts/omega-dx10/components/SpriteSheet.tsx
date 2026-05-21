import React, { useEffect, useState } from 'react';
import { View, Image } from 'react-native';

interface SpriteSheetProps {
  source: any;
  totalWidth: number;
  frameHeight: number;
  frameCount: number;
  fps?: number;
  displaySize?: number;
}

export function SpriteSheet({ source, totalWidth, frameHeight, frameCount, fps = 4, displaySize = 64 }: SpriteSheetProps) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % frameCount);
    }, 1000 / fps);
    return () => clearInterval(interval);
  }, [frameCount, fps]);

  const frameW = totalWidth / frameCount;
  const scale = displaySize / frameW;
  const scaledH = frameHeight * scale;
  const scaledTotalW = totalWidth * scale;

  return (
    <View style={{ width: displaySize, height: scaledH, overflow: 'hidden' }}>
      <Image
        source={source}
        style={{
          width: scaledTotalW,
          height: scaledH,
          transform: [{ translateX: -frame * displaySize }],
        }}
        resizeMode="stretch"
      />
    </View>
  );
}
