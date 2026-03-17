"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslations } from "@/hooks/use-translations"
import { LogOut, User } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"

export function UserInfo() {
  const { userInfo } = useAuth()
  const { t } = useTranslations()
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Verificar si el usuario tiene una imagen de perfil
    if (userInfo?.profileImage) {
      setProfileImageUrl(userInfo.profileImage)
    } else {
      setProfileImageUrl(null)
    }
  }, [userInfo])

  if (!userInfo) {
    return null
  }

  const userInitials = `${userInfo.firstName?.charAt(0) || ""}${userInfo.lastName?.charAt(0) || ""}`.toUpperCase()
  const fullName = `${userInfo.firstName || ""} ${userInfo.lastName || ""}`.trim()

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push("/auth/login")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 border-2 border-gray-100">
          <Avatar className="h-9 w-9">
            {profileImageUrl ? <AvatarImage src={profileImageUrl || "/placeholder.svg"} alt={fullName} /> : null}
            <AvatarFallback className="bg-primary/10 text-primary font-medium">{userInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{fullName}</p>
            <p className="text-xs leading-none text-muted-foreground">{userInfo.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href="/dashboard/profile">
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>{t("user_info.profile", "Perfil")}</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t("user_info.logout", "Cerrar sesión")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
