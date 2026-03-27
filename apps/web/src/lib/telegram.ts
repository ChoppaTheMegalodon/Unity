/**
 * Telegram Mini App helpers.
 * Detects if running inside Telegram and provides initData for auth.
 */

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
          };
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        colorScheme: 'light' | 'dark';
        themeParams: Record<string, string>;
        MainButton: {
          text: string;
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
        };
      };
    };
  }
}

export function isTelegramMiniApp(): boolean {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp?.initData;
}

export function getTelegramInitData(): string | null {
  if (!isTelegramMiniApp()) return null;
  return window.Telegram!.WebApp!.initData;
}

export function getTelegramUser() {
  if (!isTelegramMiniApp()) return null;
  return window.Telegram!.WebApp!.initDataUnsafe.user || null;
}

export function initTelegramApp() {
  if (isTelegramMiniApp()) {
    window.Telegram!.WebApp!.ready();
    window.Telegram!.WebApp!.expand();
  }
}
