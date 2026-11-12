import { Image } from 'react-native';
import type { ImageStyle, StyleProp } from 'react-native';

const saxetBadge = require('../../assets/saxet-badge.png');

/** The real Saxet badge artwork (navy/brick-red circular seal with the Texas silhouette), used as the app icon and wherever the brand mark appears in-app. */
export default function SaxetPatch({
  size = 44,
  style,
}: {
  size?: number;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={saxetBadge}
      resizeMode="contain"
      style={[{ width: size, height: size }, style]}
    />
  );
}
