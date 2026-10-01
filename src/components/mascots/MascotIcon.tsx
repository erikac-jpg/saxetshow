import { Image } from 'react-native';

import type { Season } from '../../util/season';

const MASCOT_IMAGE: Record<Season, ReturnType<typeof require>> = {
  deer: require('../../../assets/mascots/deer.png'),
  turkey: require('../../../assets/mascots/turkey.png'),
  hog: require('../../../assets/mascots/hog.png'),
  duck: require('../../../assets/mascots/duck.png'),
};

// Native width/height of each source cutout, used to keep its aspect ratio
// when scaled to a given display height.
const MASCOT_ASPECT: Record<Season, number> = {
  deer: 348 / 585,
  turkey: 290 / 615,
  hog: 245 / 560,
  duck: 146 / 465,
};

/** Photo-rendered seasonal mascot cutout, scaled to `size` tall with its native aspect ratio preserved. */
export default function MascotIcon({ season, size = 130 }: { season: Season; size?: number }) {
  const aspect = MASCOT_ASPECT[season];
  return (
    <Image
      source={MASCOT_IMAGE[season]}
      style={{ height: size, width: size * aspect }}
      resizeMode="contain"
    />
  );
}
