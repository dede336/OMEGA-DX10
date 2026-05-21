export interface SpriteSheetConfig {
  source: any;
  totalWidth: number;
  frameHeight: number;
  frameCount: number;
  fps?: number;
}

export const CHARACTER_SPRITE_SHEETS: Record<string, SpriteSheetConfig> = {
  palmon: { source: require('../assets/images/characters/palmon_sprite.png'), totalWidth: 194, frameHeight: 73, frameCount: 3, fps: 4 },
};

const CHARACTER_IMAGES: Record<string, any> = {
  agumon:         require('../assets/images/characters/agumon.gif'),
  agumonSaver:    require('../assets/images/characters/agumon_saver.gif'),
  geoGreymon:     require('../assets/images/characters/geoGreymon.gif'),
  rizeGreymon:    require('../assets/images/characters/rizeGreymon.gif'),
  shineGreymon:   require('../assets/images/characters/shineGreymon.gif'),
  gabumon:        require('../assets/images/characters/gabumon.gif'),
  demiDevimon:    require('../assets/images/characters/demiDevimon.gif'),
  devimon:        require('../assets/images/characters/devimon.gif'),
  myotismon:      require('../assets/images/characters/myotismon.gif'),
  vnonMyotismon:  require('../assets/images/characters/vnonMyotismon.gif'),
  greymon:        require('../assets/images/characters/greymon.gif'),
  metalGreymon:   require('../assets/images/characters/metalGreymon.gif'),
  warGreymon:     require('../assets/images/characters/warGreymon.gif'),
  garurumon:      require('../assets/images/characters/garurumon.gif'),
  wereGarurumon:  require('../assets/images/characters/wereGarurumon.gif'),
  metalGarurumon: require('../assets/images/characters/metalGarurumon.gif'),
  gulusGammamon:  require('../assets/images/characters/gulusGammamon.gif'),
  omegamon:       require('../assets/images/characters/omegamon.webp'),
  guilmon:        require('../assets/images/characters/guilmon.webp'),
  growlmon:       require('../assets/images/characters/growlmon.webp'),
  megaloGrowlmon: require('../assets/images/characters/megaloGrowlmon.webp'),
  gallantmon:              require('../assets/images/characters/gallantmon.webp'),
  gallantmonCrimsonMode:   require('../assets/images/characters/gallantmonCrimsonMode.webp'),
  lucemon:                 require('../assets/images/characters/lucemon.gif'),
  lucemonChaosMode:        require('../assets/images/characters/lucemonChaosMode.gif'),
  salamon:        require('../assets/images/characters/salamon.gif'),
  tailmon:        require('../assets/images/characters/tailmon.webp'),
  angewomon:      require('../assets/images/characters/angewomon.webp'),
  magnadramon:    require('../assets/images/characters/magnadramon.gif'),
  ophanimon:      require('../assets/images/characters/ophanimon.gif'),
  pyomon:         require('../assets/images/characters/pyomon.webp'),
  birdramon:      require('../assets/images/characters/birdramon.webp'),
  garudamon:      require('../assets/images/characters/garudamon.webp'),
  phoenixmon:     require('../assets/images/characters/phoenixmon.gif'),
  patamon:                 require('../assets/images/characters/patamon.gif'),
  angemon:                 require('../assets/images/characters/angemon.gif'),
  magnaAngemon:            require('../assets/images/characters/magnaangemon.gif'),
  togemon:        require('../assets/images/characters/togemon.gif'),
  lillymon:       require('../assets/images/characters/lillymon.gif'),
  rosemon:        require('../assets/images/characters/rosemon.webp'),
  shineGreymonBurstMode: require('../assets/images/characters/shinegreymonbm.gif'),
  goldramon:      require('../assets/images/characters/goldramon.gif'),
  seraphimon:     require('../assets/images/characters/seraphimon.gif'),
  imperialDramonFM: require('../assets/images/characters/imperialDramonFM.webp'),
  imperialDramonPM: require('../assets/images/characters/imperialDramonPM.gif'),
};

export default CHARACTER_IMAGES;
