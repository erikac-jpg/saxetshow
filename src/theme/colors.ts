/**
 * "Old Glory" palette - a patriotic red/white/blue, built on the same
 * legibility rules as the "Field Manual" palette it replaces: near-black
 * text on a crisp near-white (light) or near-white text on a near-black
 * navy ground (dark), one solid dark primary color, one accent used only
 * in small bounded shapes - never as a large background.
 *
 * Most tokens hold the exact same value in both themes - `navy`, `white`,
 * `flagRed`, `cream` and `headerSubtitle` are all used on surfaces that
 * stay dark (the navy header/button chrome) or are themselves fixed
 * decorative tints, so they don't need a dark-mode variant. Only the
 * tokens that sit directly on the page background change: `background`,
 * `surface`, `textPrimary`, `textSecondary`, `accentText`, `red`,
 * `divider`, `topoLine`, and the three notice/warning/success banner
 * backgrounds, which become dark, muted versions of the same hues rather
 * than staying light pastels.
 */
export interface ThemeColors {
  /** Page background. */
  background: string;
  /** Card/field/elevated-content background, sitting on `background`. */
  surface: string;
  /** Navy header/button/FAB chrome - stays dark in both themes. */
  navy: string;
  /** Warning/error text and destructive-outline borders. */
  red: string;
  /** Primary brand accent - small bounded shapes only (buttons, badges, rules). */
  flagRed: string;
  /** Fixed near-white, used as a decorative tint (e.g. the patch's Texas mark) - not the page background. */
  cream: string;
  /** Text/icon color on dark navy/flagRed surfaces - stays white in both themes. */
  white: string;
  textPrimary: string;
  textSecondary: string;
  /** Subtitle text on the navy header. */
  headerSubtitle: string;
  /** `navy` used as emphasis text/icons/borders directly on `background` (not as a fill). */
  accentText: string;
  /** Functional hairlines/borders. */
  divider: string;
  /** Faint decorative texture tint, for backgrounds only. */
  topoLine: string;
  /** Tan "heads up" banner background (e.g. "no profile yet"). */
  noticeBg: string;
  /** Pink warning/error banner background. */
  warningBg: string;
  /** Green success/approved/signed banner background. */
  successBg: string;
}

export const lightColors: ThemeColors = {
  background: '#F7F6F2',
  surface: '#FFFFFF',
  navy: '#1B2A41',
  red: '#8C3B2E',
  flagRed: '#9E2A2B',
  cream: '#F7F6F2',
  white: '#FFFFFF',
  textPrimary: '#1C1C1C',
  textSecondary: '#5B5347',
  headerSubtitle: '#E9B9B9',
  accentText: '#1B2A41',
  divider: '#DAD7CF',
  topoLine: 'rgba(27, 42, 65, 0.05)',
  noticeBg: '#EDE0C6',
  warningBg: '#F1DCD3',
  successBg: '#DCEBDD',
};

export const darkColors: ThemeColors = {
  // A near-black navy, not true black - keeps the "ink," not a void.
  background: '#10161F',
  surface: '#1B2430',
  navy: '#1B2A41',
  // Lifted from the light-mode error red so it still reads at ~6.5:1 on
  // the new dark background - the original value is ~2.4:1 there.
  red: '#DB8468',
  flagRed: '#9E2A2B',
  cream: '#F7F6F2',
  white: '#FFFFFF',
  // Warm off-white, never pure white - avoids the flat white-on-black
  // "AI app" look while still landing ~14.8:1 on the dark background.
  textPrimary: '#EDE8DD',
  textSecondary: '#B7AFA0',
  headerSubtitle: '#E9B9B9',
  // A lightened navy so text/icons/borders that read as `navy` on the
  // light background stay legible (~7.5:1) against the dark one.
  accentText: '#8FA8C9',
  divider: '#2E3747',
  topoLine: 'rgba(255, 255, 255, 0.04)',
  // Dark, muted versions of the same hues (not the light pastels) so the
  // near-white text sitting on top of them stays legible.
  noticeBg: '#3A3220',
  warningBg: '#3A2420',
  successBg: '#1F3326',
};
