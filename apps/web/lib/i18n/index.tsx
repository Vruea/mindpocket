"use client"

import { getWebDictionary, type Locale, type WebTranslationDict } from "@repo/i18n"
import { createContext, useCallback, useContext, useEffect, useState } from "react"

export type { Locale } from "@repo/i18n"

interface LocaleContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: WebTranslationDict
}

const STORAGE_KEY = "mindpocket-locale"
const DEFAULT_LOCALE: Locale = "en"

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (stored && (stored === "zh" || stored === "en")) {
      setLocaleState(stored)
    }
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem(STORAGE_KEY, l)
    document.documentElement.lang = l === "zh" ? "zh-CN" : "en"
  }, [])

  const t = getWebDictionary(locale)

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider")
  }
  return ctx
}

export function useT() {
  return useLocale().t
}
