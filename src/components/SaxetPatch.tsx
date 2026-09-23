import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '../theme/colors';
import { displayFont } from '../theme/fonts';

const texasMark = require('../../assets/texas-mark.png');

// Proportions below are all relative to `size`, tuned against a 52px reference badge.
export default function SaxetPatch({
  size = 44,
  style,
}: {
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const borderWidth = size * (3 / 52);
  const ringInset = size * (3 / 52);
  const ringStrokeWidth = size * (1 / 52);
  const markSize = size * (34 / 52);
  const markTop = size * (9 / 52);
  const bandInset = size * (8 / 52);
  const bandTop = size * (21 / 52);
  const bandHeight = size * (12 / 52);
  const bandRadius = size * (2 / 52);
  const fontSize = size * (9 / 52);

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - borderWidth / 2}
          fill={colors.navy}
          stroke={colors.brass}
          strokeWidth={borderWidth}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - ringInset}
          fill="none"
          stroke={colors.brass}
          strokeWidth={ringStrokeWidth}
          strokeDasharray={`${size * (2.4 / 52)} ${size * (3.2 / 52)}`}
          opacity={0.85}
        />
      </Svg>
      <Image
        source={texasMark}
        resizeMode="contain"
        style={{
          position: 'absolute',
          alignSelf: 'center',
          top: markTop,
          width: markSize,
          height: markSize,
          tintColor: colors.cream,
          opacity: 0.18,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: bandInset,
          right: bandInset,
          top: bandTop,
          height: bandHeight,
          borderRadius: bandRadius,
          backgroundColor: colors.brass,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: displayFont,
            color: colors.navy,
            fontSize,
            letterSpacing: 0.5,
          }}
        >
          SAXET
        </Text>
      </View>
    </View>
  );
}
