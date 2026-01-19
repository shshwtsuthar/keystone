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
    html.classList.remove("light", "dark", "blue-light")
    if (newTheme === "blue-light") {
      html.classList.add("blue-light")
    } else if (newTheme === "dark") {
      html.classList.add("dark")
    } else {
      html.classList.add("light")
    }
  }

  return {
    theme: (theme as Theme) || "light",
    setTheme,
    ...rest,
  }
}

