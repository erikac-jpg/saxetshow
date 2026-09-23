import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors } from '../theme/colors';

const WIDTH = 400;
const HEIGHT = 900;

// Each entry draws one wavy contour line, loosely mimicking a topo map's
// elevation lines. Values are hand-picked for a natural, non-repeating look.
const LINES = [
  { y: 40, amplitude: 16, frequency: 1.3, phase: 0.2 },
  { y: 110, amplitude: 22, frequency: 1.0, phase: 1.4 },
  { y: 190, amplitude: 14, frequency: 1.6, phase: 0.7 },
  { y: 270, amplitude: 26, frequency: 0.9, phase: 2.1 },
  { y: 350, amplitude: 18, frequency: 1.2, phase: 0.4 },
  { y: 430, amplitude: 20, frequency: 1.1, phase: 1.9 },
  { y: 510, amplitude: 15, frequency: 1.5, phase: 0.9 },
  { y: 590, amplitude: 24, frequency: 0.8, phase: 2.6 },
  { y: 670, amplitude: 17, frequency: 1.3, phase: 1.1 },
  { y: 750, amplitude: 21, frequency: 1.0, phase: 0.3 },
  { y: 830, amplitude: 16, frequency: 1.4, phase: 1.7 },
];

function wavePath(
  yBase: number,
  amplitude: number,
  frequency: number,
  phase: number,
  segments = 48,
): string {
  let d = '';
  for (let i = 0; i <= segments; i++) {
    const x = (i / segments) * WIDTH;
    const y = yBase + Math.sin((i / segments) * Math.PI * 2 * frequency + phase) * amplitude;
    d += `${i === 0 ? 'M' : ' L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return d;
}

export default function TopoBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none">
        {LINES.map((line, i) => (
          <Path
            key={i}
            d={wavePath(line.y, line.amplitude, line.frequency, line.phase)}
            stroke={colors.topoLine}
            strokeWidth={1.5}
            fill="none"
          />
        ))}
      </Svg>
    </View>
  );
}
