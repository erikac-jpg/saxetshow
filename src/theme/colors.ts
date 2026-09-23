/**
 * "Field Manual" palette - warm, high-contrast, and deliberately
 * generous on legibility. The primary audience for this app skews
 * older, so contrast and familiarity matter more here than trend:
 * near-black text on warm cream, a solid dark primary color, and a
 * muted earthy accent instead of a bright/saturated one.
 *
 * `navy` and `red` keep their original names (most of the app already
 * references them) but now hold different roles than the original
 * red/white/navy patriotic palette:
 *   - `navy` is the primary brand color (deep forest green).
 *   - `red` is reserved for genuine warnings/errors/destructive
 *     actions only - a muted, earthy red, not a bright alarm color.
 *   - `brass` is the new general accent/CTA color, for anything that
 *     isn't a warning (primary buttons, links, decorative accents).
 */
export const colors = {
  navy: '#2F4739',
  red: '#8C3B2E',
  brass: '#B08D4F',
  cream: '#F2EDE3',
  white: '#FFFFFF',
  textPrimary: '#1C1C1C',
  textSecondary: '#5B5347',
  headerSubtitle: '#D9CBB0',
  /** Functional hairlines/borders - kept visible, not the literal 5% tint below. */
  divider: '#D9D2C0',
  /** True "topo line at 5%" tint, for decorative use only - too faint for anything functional. */
  topoLine: 'rgba(47, 71, 57, 0.05)',
};
