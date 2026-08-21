"use client";

import { useEffect, useRef, useState } from "react";
import { Globe, Check } from "lucide-react";
import { SUPPORTED_LANGUAGES, LanguageCode, LanguageOption } from "@/lib/i18n";

export function LanguageSelector() {
  const [currentLang, setCurrentLang] = useState<LanguageCode>("fr");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("koryxa:language") as LanguageCode;
    if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
      setCurrentLang(saved);
      document.documentElement.lang = saved;
      if (saved === "ar") {
        document.documentElement.dir = "rtl";
      } else {
        document.documentElement.dir = "ltr";
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectLanguage = (code: LanguageCode) => {
    setCurrentLang(code);
    window.localStorage.setItem("koryxa:language", code);
    document.documentElement.lang = code;
    if (code === "ar") {
      document.documentElement.dir = "rtl";
    } else {
      document.documentElement.dir = "ltr";
    }
    setOpen(false);
    // Dispatch event so any listening component updates instantly
    window.dispatchEvent(new CustomEvent("koryxa:language-changed", { detail: code }));
  };

  const activeOption = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border/80 bg-card hover:bg-muted/60 text-foreground transition text-xs font-bold shadow-2xs cursor-pointer"
        title="Changer la langue / Change language"
      >
        <span className="text-sm">{activeOption.flag}</span>
        <span className="hidden sm:inline text-xs font-semibold">{activeOption.code.toUpperCase()}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-card border border-border shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            Langue / Language
          </div>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = lang.code === currentLang;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => selectLanguage(lang.code)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isSelected
                    ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-bold"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">{lang.flag}</span>
                  <span>{lang.label}</span>
                </span>
                {isSelected && <Check size={14} className="text-emerald-600 dark:text-emerald-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
