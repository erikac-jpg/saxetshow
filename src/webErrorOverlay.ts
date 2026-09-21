import { Platform } from 'react-native';

/**
 * A blank white page with no visible error is nearly impossible to debug
 * from a tablet with no dev tools access. This is a last-resort safety
 * net for the web build only: any otherwise-invisible crash (including
 * one thrown while the app's modules are still loading, before React
 * itself ever mounts) gets written directly onto the page as plain text,
 * so it can just be read off the screen and relayed back instead of
 * staying a silent blank page.
 *
 * Must be the very first import in index.ts - import order is the only
 * thing that guarantees these listeners are registered before anything
 * else (including App and its own imports) has a chance to throw.
 */
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  const showError = (title: string, detail: string) => {
    const box = document.createElement('div');
    box.style.cssText =
      'position:fixed;inset:0;background:#1A2E4A;color:#fff;padding:20px;' +
      'font-family:monospace;font-size:13px;white-space:pre-wrap;overflow:auto;z-index:99999;';
    box.textContent = `${title}\n\n${detail}`;
    document.body.appendChild(box);
  };

  window.addEventListener('error', (event) => {
    showError('App crashed while loading:', event.error?.stack || event.message || String(event));
  });

  window.addEventListener('unhandledrejection', (event) => {
    showError('Unhandled promise rejection:', event.reason?.stack || String(event.reason));
  });
}
