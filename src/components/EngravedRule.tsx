import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

/**
 * A restrained "engraved" section rule: a full-width hairline with either a
 * short, darker accent segment just beneath it, or a small centered diamond
 * mark sitting on the line - a currency/document engraving motif, used in
 * place of a single flat divider line between stacked content sections.
 */
export default function EngravedRule({
  ornament = false,
  style,
}: {
  /** Use the centered diamond mark instead of the short accent segment - reserve for a page's one or two most prominent breaks. */
  ornament?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.hairline} />
      {ornament ? <View style={styles.diamond} /> : <View style={styles.accent} />}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: {
    marginVertical: 22,
    alignItems: 'center',
  },
  hairline: {
    width: '100%',
    height: 1,
    backgroundColor: colors.divider,
  },
  accent: {
    marginTop: 4,
    width: 56,
    height: 2,
    backgroundColor: colors.navy,
    opacity: 0.35,
  },
  diamond: {
    position: 'absolute',
    top: -4.5,
    width: 10,
    height: 10,
    backgroundColor: colors.flagRed,
    transform: [{ rotate: '45deg' }],
  },
});
