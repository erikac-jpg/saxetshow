import { useState } from 'react';
import Svg, { Path, G } from 'react-native-svg';
import { StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';

import { useTheme } from '../theme/ThemeContext';

const VIEW_W = 220;
const VIEW_H = 160;
const SPAN_LEFT = -40;
const SPAN_RIGHT = 260;
// Steep enough that the band clears the header's own content (a star
// row, a back button) within a short horizontal run instead of staying
// low enough to cross them most of the way across the screen.
const ROTATION_DEG = 34;
// The `height` value the band geometry below (thickness, gap, bow,
// vertical start) was tuned at, showing all four stripes cleanly. Every
// instance scales that geometry by its own `height` relative to this, so
// a short ribbon reads as a smaller version of the same shape instead of
// the same fixed-pixel bands getting vertically squashed into a smear by
// the SVG's own height stretch.
const REF_HEIGHT = 110;
// How far past the header's own padding a full-bleed ribbon overshoots
// left and right, so its horizontal ends run off the header's true
// left/right edge (and get clipped there by the header's overflow:
// hidden) instead of stopping short inside the padding where the cut
// would be visible.
const EDGE_BLEED = 48;
// How far a confined (non-full-bleed) ribbon overshoots past its own
// anchor corner, so it still bleeds off that one corner rather than
// sitting flush against it.
const CORNER_BLEED = 10;

/** One smooth S-curve (a single wave crest flowing into a trough, not a uniform rainbow-shaped arc) for a band's top edge at baseline `y`; the bottom edge is the same curve offset down by `thickness`. */
function bandPath(y: number, thickness: number, bow: number): string {
  const midX = (SPAN_LEFT + SPAN_RIGHT) / 2;
  const c1x = SPAN_LEFT + (midX - SPAN_LEFT) * 0.5;
  const c2x = midX + (SPAN_RIGHT - midX) * 0.5;
  // The two control points bow in opposite directions (one up, one down),
  // which is what actually produces a wave's crest-then-trough S-shape -
  // same-direction control points just make a uniform rainbow-like arc.
  const topArc = `M${SPAN_LEFT},${y} C${c1x},${y - bow} ${c2x},${y + bow} ${SPAN_RIGHT},${y}`;
  const yb = y + thickness;
  const bottomArc = `L${SPAN_RIGHT},${yb} C${c2x},${yb + bow} ${c1x},${yb - bow} ${SPAN_LEFT},${yb}`;
  return `${topArc} ${bottomArc} Z`;
}

/**
 * A single, subtle waving ribbon - four alternating red/white stripes,
 * drawn as one smooth bow rather than a repeating ripple, rotated onto
 * the diagonal. `corner` picks which corner it hugs and which side reads
 * as the "bold" (red) end. By default it's a compact flourish confined
 * to that one corner (bleeding off just its own two edges) so it never
 * reaches across the header into a title or a star row; pass
 * `fullBleed` only where the header gives it clear room to run edge to
 * edge the whole way across (see EventsHomeScreen, EventDetailScreen).
 */
export default function HeroRibbon({
  // Thin and low-opacity by default so it reads as a quiet corner
  // flourish rather than competing with a back button or title - pass
  // the larger/bolder props explicitly only where the header gives the
  // ribbon room for that.
  height = 46,
  opacity = 0.4,
  /** Which corner this hugs, and which side reads as the bold end. */
  corner = 'topLeft',
  /** Run the full width of the header, bleeding off both left and right, instead of staying confined to `corner`. */
  fullBleed = false,
  style,
}: {
  height?: number;
  opacity?: number;
  corner?: 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft';
  fullBleed?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useTheme();
  // The anchor-edge overshoot scales with height (floored so a very short
  // ribbon still bleeds off its edge instead of sitting flush); band
  // thickness/gap/bow/start stay at the fixed values they were tuned at
  // - since boxHeight = height + anchorBleed grows in step with height,
  // the SVG's own height-stretch ratio (boxHeight / VIEW_H) already scales
  // those fixed values down for a shorter ribbon, so scaling them again
  // here would shrink them twice.
  const anchorBleed = Math.max(6, 14 * (height / REF_HEIGHT));
  const thickness = 16;
  const gap = 6;
  const bow = 38;
  const startY = -16;
  const bandColors = [colors.flagRed, colors.cream, colors.flagRed, colors.cream];
  // Full-bleed needs the SVG's pixel width set explicitly (and matched
  // exactly by its viewBox-stretch target) to reliably fill the header
  // edge-to-edge - a plain View stretches correctly from left/right
  // alone, but an <Svg> with no width prop doesn't reliably pick that up.
  // Measure the wrapper instead and size the Svg to match once known.
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);
  const handleLayout = (event: LayoutChangeEvent) => {
    const w = event.nativeEvent.layout.width;
    if (w > 0 && w !== measuredWidth) setMeasuredWidth(w);
  };
  // A confined ribbon keeps the same proportions as the box it was
  // designed in, just scaled by height.
  const confinedWidth = height * (VIEW_W / VIEW_H);

  const corners: Record<typeof corner, StyleProp<ViewStyle>> = fullBleed
    ? {
        topLeft: { top: -anchorBleed, left: -EDGE_BLEED, right: -EDGE_BLEED },
        topRight: { top: -anchorBleed, left: -EDGE_BLEED, right: -EDGE_BLEED, transform: [{ scaleX: -1 }] },
        bottomRight: {
          bottom: -anchorBleed,
          left: -EDGE_BLEED,
          right: -EDGE_BLEED,
          transform: [{ scaleX: -1 }, { scaleY: -1 }],
        },
        bottomLeft: { bottom: -anchorBleed, left: -EDGE_BLEED, right: -EDGE_BLEED, transform: [{ scaleY: -1 }] },
      }
    : {
        topLeft: { top: -CORNER_BLEED, left: -CORNER_BLEED },
        topRight: { top: -CORNER_BLEED, right: -CORNER_BLEED, transform: [{ scaleX: -1 }] },
        bottomRight: { bottom: -CORNER_BLEED, right: -CORNER_BLEED, transform: [{ scaleX: -1 }, { scaleY: -1 }] },
        bottomLeft: { bottom: -CORNER_BLEED, left: -CORNER_BLEED, transform: [{ scaleY: -1 }] },
      };

  const boxHeight = fullBleed ? height + anchorBleed : height + CORNER_BLEED;
  const boxWidth = fullBleed ? measuredWidth : confinedWidth + CORNER_BLEED;

  return (
    <View
      onLayout={fullBleed ? handleLayout : undefined}
      style={[styles.wrapper, { height: boxHeight }, corners[corner], style]}
      pointerEvents="none"
    >
      {boxWidth ? (
        <Svg
          width={boxWidth}
          height={boxHeight}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="none"
          opacity={opacity}
        >
          <G transform={`rotate(-${ROTATION_DEG} ${VIEW_W / 2} ${VIEW_H / 2})`}>
            {bandColors.map((color, i) => (
              <Path key={i} d={bandPath(startY + i * (thickness + gap), thickness, bow)} fill={color} />
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
