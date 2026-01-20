"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronsUpDown, LogOut, Settings, Palette, Check } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/hooks/use-theme"
import { type Theme } from "@/components/providers/theme-provider"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { signOut } from "@/app/actions/auth"

interface UserSwitcherProps {
  user: {
    name: string
    email?: string
  }
}

export const UserSwitcher = ({ user }: UserSwitcherProps) => {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const handleSignOut = async () => {
    await signOut()
  }

  const handleSettings = () => {
    router.push("/dashboard/settings")
  }

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
  }

  const getInitials = (name: string) => {
    if (!name || name.trim().length === 0) {
      return "U"
    }
    const parts = name.trim().split(" ").filter((n) => n.length > 0)
    if (parts.length === 0) {
      return name[0]?.toUpperCase() || "U"
    }
    if (parts.length === 1) {
      return parts[0][0]?.toUpperCase() || "U"
    }
    return (parts[0][0] + parts[parts.length - 1][0])
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <span className="text-xs font-medium">
                  {getInitials(user.name)}
                </span>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                {user.email && (
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                )}
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Account
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={handleSettings} className="gap-2 p-2">
              <Settings className="size-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2 p-2">
                <Palette className="size-4" />
                <span>Theme</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onClick={() => handleThemeChange("light")}
                  className="gap-2 p-2"
                >
                  <div className="flex items-center gap-2">
                    {theme === "light" ? (
                      <Check className="size-4" />
                    ) : (
                      <div className="size-4" />
                    )}
                    <span>Light</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleThemeChange("blue")}
                  className="gap-2 p-2"
                >
                  <div className="flex items-center gap-2">
                    {theme === "blue" ? (
                      <Check className="size-4" />
                    ) : (
                      <div className="size-4" />
                    )}
                    <span>Blue</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleThemeChange("yellow")}
                  className="gap-2 p-2"
                >
                  <div className="flex items-center gap-2">
                    {theme === "yellow" ? (
                      <Check className="size-4" />
                    ) : (
                      <div className="size-4" />
                    )}
                    <span>Yellow</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleThemeChange("orange")}
                  className="gap-2 p-2"
                >
                  <div className="flex items-center gap-2">
                    {theme === "orange" ? (
                      <Check className="size-4" />
                    ) : (
                      <div className="size-4" />
                    )}
                    <span>Orange</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleThemeChange("red")}
                  className="gap-2 p-2"
                >
                  <div className="flex items-center gap-2">
                    {theme === "red" ? (
                      <Check className="size-4" />
                    ) : (
                      <div className="size-4" />
                    )}
                    <span>Red</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleThemeChange("green")}
                  className="gap-2 p-2"
                >
                  <div className="flex items-center gap-2">
                    {theme === "green" ? (
                      <Check className="size-4" />
                    ) : (
                      <div className="size-4" />
                    )}
                    <span>Green</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleThemeChange("violet")}
                  className="gap-2 p-2"
                >
                  <div className="flex items-center gap-2">
                    {theme === "violet" ? (
                      <Check className="size-4" />
                    ) : (
                      <div className="size-4" />
                    )}
                    <span>Violet</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="gap-2 p-2"
              variant="destructive"
            >
              <LogOut className="size-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

