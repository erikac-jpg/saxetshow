import Svg, { Path, G } from 'react-native-svg';
import { StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { useTheme } from '../theme/ThemeContext';

const VIEW_W = 220;
const VIEW_H = 160;
// How far above/below the flat baseline the single bow rises - one
// gentle, subtle movement rather than a repeating ripple, but still
// visible within the small clipped corner the ribbon renders in.
const BOW = 38;
const SPAN_LEFT = -40;
const SPAN_RIGHT = 260;

/** One smooth S-curve (a single wave crest flowing into a trough, not a uniform rainbow-shaped arc) for a band's top edge at baseline `y`; the bottom edge is the same curve offset down by `thickness`. */
function bandPath(y: number, thickness: number): string {
  const midX = (SPAN_LEFT + SPAN_RIGHT) / 2;
  const c1x = SPAN_LEFT + (midX - SPAN_LEFT) * 0.5;
  const c2x = midX + (SPAN_RIGHT - midX) * 0.5;
  // The two control points bow in opposite directions (one up, one down),
  // which is what actually produces a wave's crest-then-trough S-shape -
  // same-direction control points just make a uniform rainbow-like arc.
  const topArc = `M${SPAN_LEFT},${y} C${c1x},${y - BOW} ${c2x},${y + BOW} ${SPAN_RIGHT},${y}`;
  const yb = y + thickness;
  const bottomArc = `L${SPAN_RIGHT},${yb} C${c2x},${yb + BOW} ${c1x},${yb - BOW} ${SPAN_LEFT},${yb}`;
  return `${topArc} ${bottomArc} Z`;
}

/**
 * A single, subtle waving ribbon - five stripes (starting and ending on
 * red, like the real flag's stripe count parity), drawn as one smooth bow
 * rather than a repeating ripple, rotated onto the diagonal. The brand's
 * one recurring decorative motif, clipped to a navy header's corner behind
 * the title.
 */
export default function HeroRibbon({
  // Small and low-opacity by default so it reads as a corner flourish
  // behind a back button, not something fighting left-aligned title text
  // for contrast - pass the larger/bolder props explicitly for a marquee
  // hero header (see EventsHomeScreen) where the title sits clear of it.
  width = 120,
  height = 90,
  opacity = 0.4,
  /** Which header corner this flows from/into. */
  corner = 'topLeft',
  style,
}: {
  width?: number;
  height?: number;
  opacity?: number;
  corner?: 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft';
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useTheme();
  const thickness = 16;
  const gap = 6;
  const bandColors = [colors.flagRed, colors.cream, colors.flagRed, colors.cream, colors.flagRed];
  const startY = -16;

  const corners: Record<typeof corner, StyleProp<ViewStyle>> = {
    topLeft: { top: 0, left: 0 },
    topRight: { top: 0, right: 0, transform: [{ scaleX: -1 }] },
    bottomRight: { bottom: 0, right: 0, transform: [{ scaleX: -1 }, { scaleY: -1 }] },
    bottomLeft: { bottom: 0, left: 0, transform: [{ scaleY: -1 }] },
  };

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      style={[styles.svg, corners[corner], style]}
      opacity={opacity}
      pointerEvents="none"
    >
      <G transform={`rotate(-24 ${VIEW_W / 2} ${VIEW_H / 2})`}>
        {bandColors.map((color, i) => (
          <Path key={i} d={bandPath(startY + i * (thickness + gap), thickness)} fill={color} />
        ))}
      </G>
    </Svg>
  );
}

const styles = StyleSheet.create({
  svg: {
    position: 'absolute',
  },
});
