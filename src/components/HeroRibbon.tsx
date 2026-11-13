import { useState } from 'react';
import Svg, { Path, G } from 'react-native-svg';
import { StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';

import { useTheme } from '../theme/ThemeContext';

const VIEW_W = 220;
const VIEW_H = 160;
// How far above/below the flat baseline the single bow rises - one
// gentle, subtle movement rather than a repeating ripple, but still
// visible within the small clipped corner the ribbon renders in.
const BOW = 38;
const SPAN_LEFT = -40;
const SPAN_RIGHT = 260;
// How far past the header's own padding the ribbon box overshoots on
// every side, so its ends run off the header's true outer edge (and get
// clipped there by the header's overflow: hidden) instead of stopping
// short inside the padding where the cut would be visible.
const EDGE_BLEED = 48;

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
 * rather than a repeating ripple, rotated onto the diagonal. Always runs
 * the full width of its header so both ends bleed off the screen's true
 * edges rather than stopping mid-header; `corner` picks which top/bottom
 * edge it hugs and which side reads as the "bold" end.
 */
export default function HeroRibbon({
  // Thin and low-opacity by default so it reads as a quiet flourish behind
  // a back button, not something fighting left-aligned title text for
  // contrast - pass the larger/bolder props explicitly for a marquee hero
  // header (see EventsHomeScreen) where the title sits clear of it.
  height = 90,
  opacity = 0.4,
  /** Which header edge this hugs, and which side reads as the bold end. */
  corner = 'topLeft',
  style,
}: {
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
  // The SVG needs its pixel width set explicitly (and matched exactly by
  // its viewBox-stretch target) to reliably fill the header edge-to-edge -
  // a plain View stretches correctly from left/right alone, but an <Svg>
  // with no width prop doesn't reliably pick that up. Measure the wrapper
  // instead and size the Svg to match once we know it.
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);
  const handleLayout = (event: LayoutChangeEvent) => {
    const w = event.nativeEvent.layout.width;
    if (w > 0 && w !== measuredWidth) setMeasuredWidth(w);
  };

  const corners: Record<typeof corner, StyleProp<ViewStyle>> = {
    topLeft: { top: -EDGE_BLEED, left: -EDGE_BLEED, right: -EDGE_BLEED },
    topRight: { top: -EDGE_BLEED, left: -EDGE_BLEED, right: -EDGE_BLEED, transform: [{ scaleX: -1 }] },
    bottomRight: {
      bottom: -EDGE_BLEED,
      left: -EDGE_BLEED,
      right: -EDGE_BLEED,
      transform: [{ scaleX: -1 }, { scaleY: -1 }],
    },
    bottomLeft: { bottom: -EDGE_BLEED, left: -EDGE_BLEED, right: -EDGE_BLEED, transform: [{ scaleY: -1 }] },
  };

  const boxHeight = height + EDGE_BLEED;

  return (
    <View
      onLayout={handleLayout}
      style={[styles.wrapper, { height: boxHeight }, corners[corner], style]}
      pointerEvents="none"
    >
      {measuredWidth ? (
        <Svg
          width={measuredWidth}
          height={boxHeight}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="none"
          opacity={opacity}
        >
          <G transform={`rotate(-24 ${VIEW_W / 2} ${VIEW_H / 2})`}>
            {bandColors.map((color, i) => (
              <Path key={i} d={bandPath(startY + i * (thickness + gap), thickness)} fill={color} />
            ))}
          </G>
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
  },
});
