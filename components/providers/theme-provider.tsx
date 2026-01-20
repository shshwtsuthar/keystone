"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export type Theme = "light" | "blue" | "yellow" | "orange" | "red" | "green" | "violet"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      themes={["light", "blue", "yellow", "orange", "red", "green", "violet"]}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

