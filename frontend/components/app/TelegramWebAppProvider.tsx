"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        enableClosingConfirmation: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        isExpanded: boolean;
        viewportHeight: number;
        initData: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
        };
        HapticFeedback?: {
          impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
          notificationOccurred: (type: "error" | "success" | "warning") => void;
          selectionChanged: () => void;
        };
      };
    };
  }
}

export function TelegramWebAppProvider() {
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const tg = window.Telegram?.WebApp;
    if (tg && typeof tg.ready === "function") {
      setIsTelegram(true);
      try {
        tg.ready();
        tg.expand();
        if (typeof tg.enableClosingConfirmation === "function") {
          tg.enableClosingConfirmation();
        }
        if (typeof tg.setHeaderColor === "function") {
          tg.setHeaderColor("#047857");
        }
        if (typeof tg.setBackgroundColor === "function") {
          tg.setBackgroundColor("#ffffff");
        }

        // Store Telegram user info in session if present
        if (tg.initDataUnsafe?.user) {
          window.sessionStorage.setItem(
            "koryxa:telegram-user",
            JSON.stringify(tg.initDataUnsafe.user)
          );
        }
      } catch (err) {
        console.warn("Telegram WebApp initialization notice:", err);
      }
    }
  }, []);

  return null;
}
