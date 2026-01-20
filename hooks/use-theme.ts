"use client"

import { useTheme as useNextTheme } from "next-themes"
import { type Theme } from "@/components/providers/theme-provider"
import { useEffect } from "react"

export const useTheme = () => {
  const { theme, setTheme: setNextTheme, ...rest } = useNextTheme()

  const setTheme = (newTheme: Theme) => {
    setNextTheme(newTheme)
    // Ensure the theme class is applied immediately
    const html = document.documentElement
    const themeClasses: Theme[] = ["light", "blue", "yellow", "orange", "red", "green", "violet"]
    html.classList.remove(...themeClasses)
    html.classList.add(newTheme)
  }

  return {
    theme: (theme as Theme) || "light",
    setTheme,
    ...rest,
  }
}

