import { useState, useEffect } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    auth_date?: number;
    hash?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  ready: () => void;
  close: () => void;
  expand: () => void;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export interface AuthState {
  isAuthenticated: boolean;
  user: TelegramUser | null;
  isLoading: boolean;
  error: string | null;
}

export const useTelegramAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const initTelegram = () => {
      try {
        // Проверяем, что мы внутри Telegram WebApp
        if (!window.Telegram?.WebApp) {
          setAuthState({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: 'Приложение должно быть запущено внутри Telegram',
          });
          return;
        }

        const tg = window.Telegram.WebApp;
        
        // Инициализируем WebApp
        tg.ready();
        tg.expand();

        // Получаем данные пользователя
        const user = tg.initDataUnsafe.user;
        
        if (!user) {
          setAuthState({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: 'Не удалось получить данные пользователя',
          });
          return;
        }

        // Проверяем валидность данных
        if (!tg.initDataUnsafe.hash) {
          setAuthState({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: 'Неверные данные авторизации',
          });
          return;
        }

        // Успешная авторизация
        setAuthState({
          isAuthenticated: true,
          user: {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            photo_url: user.photo_url,
            auth_date: tg.initDataUnsafe.auth_date || Date.now() / 1000,
            hash: tg.initDataUnsafe.hash || '',
          },
          isLoading: false,
          error: null,
        });

      } catch (error) {
        console.error('Telegram auth error:', error);
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: 'Ошибка инициализации Telegram WebApp',
        });
      }
    };

    // Задержка для загрузки Telegram WebApp API
    const timer = setTimeout(initTelegram, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
    });
    
    // Закрываем WebApp
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.close();
    }
  };

  const getAuthHeaders = () => {
    if (!window.Telegram?.WebApp) return {};
    
    return {
      'X-Telegram-Init-Data': window.Telegram.WebApp.initData,
    };
  };

  return {
    ...authState,
    logout,
    getAuthHeaders,
    telegramWebApp: window.Telegram?.WebApp,
  };
};