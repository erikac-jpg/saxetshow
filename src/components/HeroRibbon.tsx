import Svg, { Line } from 'react-native-svg';
import { StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { useTheme } from '../theme/ThemeContext';

/**
 * Flowing diagonal red/ivory ribbon - the brand's one recurring decorative
 * motif, clipped to a navy header's top-left corner behind the title. A
 * restrained echo of a flag's stripes, replacing the old full tone-on-tone
 * flag silhouette (FlagWatermark) everywhere for one consistent look.
 */
export default function HeroRibbon({
  // Small and low-opacity by default so it reads as a corner flourish
  // behind a back button, not something fighting left-aligned title text
  // for contrast - pass the larger/bolder props explicitly for a marquee
  // hero header (see EventsHomeScreen) where the title sits clear of it.
  width = 120,
  height = 90,
  opacity = 0.4,
  style,
}: {
  width?: number;
  height?: number;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useTheme();
  const bands = [
    { offset: -40, color: colors.flagRed },
    { offset: -12, color: colors.cream },
    { offset: 16, color: colors.flagRed },
  ];
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 220 160"
      style={[styles.svg, style]}
      opacity={opacity}
      pointerEvents="none"
    >
      {bands.map((band, i) => (
        <Line
          key={i}
          x1={-40 + band.offset}
          y1={-20}
          x2={120 + band.offset}
          y2={200}
          stroke={band.color}
          strokeWidth={16}
          strokeLinecap="round"
        />
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
