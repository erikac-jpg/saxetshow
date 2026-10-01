/**
 * "Old Glory" palette - a patriotic red/white/blue, built on the same
 * legibility rules as the "Field Manual" palette it replaces: near-black
 * text on a crisp near-white, one solid dark primary color, one accent
 * used only in small bounded shapes (buttons, badges, card edges) - never
 * as a large background, which is what keeps it from feeling loud.
 *
 * `navy` and `red` keep their original names (every screen already
 * references them) but `navy` is back to an actual navy blue here, not
 * the forest green it briefly held. `red` stays exactly what it was -
 * a muted, earthy warning/error red - specifically so it stays visually
 * distinct from `flagRed`, the new brighter accent. A vendor should never
 * mistake an error message for a normal button.
 */
export const colors = {
  navy: '#0C2D57',
  red: '#8C3B2E',
  flagRed: '#B3242F',
  cream: '#F7F6F2',
  white: '#FFFFFF',
  textPrimary: '#1C1C1C',
  textSecondary: '#5B5347',
  headerSubtitle: '#E9B9B9',
  /** Functional hairlines/borders - kept visible, not the literal 5% tint below. */
  divider: '#DAD7CF',
  /** True "topo line at 5%" tint, for decorative use only - too faint for anything functional. */
  topoLine: 'rgba(12, 45, 87, 0.05)',
};
