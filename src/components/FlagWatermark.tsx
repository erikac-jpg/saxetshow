import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors } from '../theme/colors';

// Tone-on-tone flag silhouette (stripes + canton + stars), all white at low
// opacity, for use inside solid navy shapes only (header bars, card image
// strips) - never behind body text or on the cream background.
const W = 190;
const H = 100;
const AMPLITUDE = 3.4;
const WAVELENGTH = 95;
const PHASE = 0.6;

function wave(x: number): number {
  return AMPLITUDE * Math.sin((2 * Math.PI * x) / WAVELENGTH + PHASE);
}

function wavyBandPath(yTop: number, yBottom: number, width: number, segments = 48): string {
  const top: [number, number][] = [];
  const bottom: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const x = (width * i) / segments;
    top.push([x, yTop + wave(x)]);
    bottom.push([x, yBottom + wave(x)]);
  }
  const toLines = (pts: [number, number][]) =>
    pts.map(([x, y]) => `L${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  return `M${top[0][0].toFixed(2)},${top[0][1].toFixed(2)} ${toLines(top.slice(1))} ${toLines(
    [...bottom].reverse()
  )} Z`;
}

function wavyCantonPath(width: number, height: number, segments = 28): string {
  const bottom: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const x = (width * i) / segments;
    bottom.push([x, height + wave(x)]);
  }
  const last = bottom[bottom.length - 1];
  const toLines = (pts: [number, number][]) =>
    pts.map(([x, y]) => `L${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  return `M0,0 L${width.toFixed(2)},0 L${last[0].toFixed(2)},${last[1].toFixed(2)} ${toLines(
    bottom.slice(0, -1).reverse()
  )} Z`;
}

function starPath(cx: number, cy: number, rOuter: number, rotationDeg = -90): string {
  const rInner = rOuter * 0.382;
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = ((rotationDeg + i * 36) * Math.PI) / 180;
    const r = i % 2 === 0 ? rOuter : rInner;
    points.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  return `M${points.join(' L')} Z`;
}

const STRIPE_H = H / 13;
const CANTON_W = W * 0.4;
const CANTON_H = STRIPE_H * 7;

const STRIPE_PATHS: string[] = [];
for (let i = 0; i < 13; i++) {
  if (i % 2 === 0) {
    STRIPE_PATHS.push(wavyBandPath(i * STRIPE_H, (i + 1) * STRIPE_H, W));
  }
}
const CANTON_PATH = wavyCantonPath(CANTON_W, CANTON_H);
const STAR_PATHS: string[] = [];
const ROWS = 5;
const COLS = 4;
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const cx = (CANTON_W * (c + 0.5)) / COLS;
    const cy = (CANTON_H * (r + 0.5)) / ROWS + wave(cx);
    STAR_PATHS.push(starPath(cx, cy, 2.6));
  }
}

export default function FlagWatermark({
  fabricOpacity = 0.08,
  cantonOpacity = 0.06,
  starOpacity = 0.2,
  angleDeg = 12,
}: {
  fabricOpacity?: number;
  cantonOpacity?: number;
  starOpacity?: number;
  angleDeg?: number;
}) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Oversized (220%) and centered so rotating it never exposes a
          plain-navy corner, however the parent shape is proportioned. */}
      <View
        style={{
          position: 'absolute',
          width: '220%',
          height: '220%',
          left: '-60%',
          top: '-60%',
          transform: [{ rotate: `${angleDeg}deg` }],
        }}
      >
        <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
          {STRIPE_PATHS.map((d, i) => (
            <Path key={`stripe-${i}`} d={d} fill={colors.white} opacity={fabricOpacity} />
          ))}
          <Path d={CANTON_PATH} fill={colors.white} opacity={cantonOpacity} />
          {STAR_PATHS.map((d, i) => (
            <Path key={`star-${i}`} d={d} fill={colors.white} opacity={starOpacity} />
          ))}
        </Svg>
      </View>
    </View>
  );
}
