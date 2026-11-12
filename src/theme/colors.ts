/**
 * "Americana Editorial" palette - a vintage event-poster patriotic look:
 * midnight navy and warm ivory as the primary pair, brick red reserved for
 * accents and dividing lines, dusty blue for secondary/muted text on navy
 * surfaces. Same legibility rules as the palette it replaces - near-black
 * text on a crisp light background (light theme) or near-white text on a
 * near-black navy ground (dark theme), one solid dark primary color, one
 * accent used only in small bounded shapes - never as a large background.
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
  /** Subtitle/muted text on the navy header - dusty blue. */
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
  background: '#F6F1E7',
  surface: '#FFFFFF',
  navy: '#14243B',
  red: '#A73536',
  flagRed: '#A73536',
  cream: '#F6F1E7',
  white: '#FFFFFF',
  textPrimary: '#14243B',
  textSecondary: '#5C6B82',
  headerSubtitle: '#9AAFC7',
  accentText: '#14243B',
  divider: '#DDD3BE',
  topoLine: 'rgba(20, 36, 59, 0.05)',
  noticeBg: '#EDE0C6',
  warningBg: '#F0DAD2',
  successBg: '#DCEBDD',
};

export const darkColors: ThemeColors = {
  // A near-black navy, not true black - keeps the "ink," not a void.
  background: '#0F1826',
  surface: '#1B2740',
  navy: '#14243B',
  // Lifted from the light-mode brick red so it still reads at good
  // contrast on the new dark background.
  red: '#C85A54',
  flagRed: '#A73536',
  cream: '#F6F1E7',
  white: '#FFFFFF',
  // Warm off-white, never pure white - avoids the flat white-on-black
  // "AI app" look while still landing at high contrast on the dark background.
  textPrimary: '#EDE8DD',
  textSecondary: '#B7AFA0',
  headerSubtitle: '#9AAFC7',
  // Dusty blue doubles as the lightened accent that reads clearly against
  // the dark navy background.
  accentText: '#9AAFC7',
  divider: '#2E3747',
  topoLine: 'rgba(255, 255, 255, 0.04)',
  // Dark, muted versions of the same hues (not the light pastels) so the
  // near-white text sitting on top of them stays legible.
  noticeBg: '#3A3220',
  warningBg: '#3A2420',
  successBg: '#1F3326',
};
