"use client"

import * as React from "react"
import { ChevronsUpDown, LogOut, Bell, Settings } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

  const handleSignOut = async () => {
    await signOut()
  }

  const handleNotifications = () => {
    // TODO: Navigate to notifications page or open notifications panel
    console.log("Notifications clicked")
  }

  const handleSettings = () => {
    // TODO: Navigate to settings page
    console.log("Settings clicked")
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
            <DropdownMenuItem
              onClick={handleNotifications}
              className="gap-2 p-2"
            >
              <Bell className="size-4" />
              <span>Notifications</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSettings} className="gap-2 p-2">
              <Settings className="size-4" />
              <span>Settings</span>
            </DropdownMenuItem>
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

