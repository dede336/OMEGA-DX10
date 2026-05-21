import { ElementId } from '@/constants/gameData';
import { ImageSourcePropType } from 'react-native';

const ELEMENT_IMAGES: Partial<Record<ElementId, ImageSourcePropType>> = {
  LIGHT: require('../assets/images/elements/luz.png'),
  FIRE:  require('../assets/images/elements/fogo.png'),
};

export default ELEMENT_IMAGES;
