"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { LogOut, Loader2 } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  showIcon?: boolean
  className?: string
}

export function LogoutButton({
  variant = "outline",
  size = "default",
  showIcon = true,
  className = "",
}: LogoutButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Definir las claves de traducción que necesitamos
  const translationKeys = ["auth.logout", "auth.logging_out"]

  // Usar el hook de traducciones
  const { t } = useTranslations(translationKeys)

  const handleLogout = async () => {
    setIsLoading(true)

    try {
      await supabase.auth.signOut()
      router.push("/auth/login")
      router.refresh()
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleLogout} disabled={isLoading} className={className}>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {showIcon && <LogOut className={`h-4 w-4 ${size !== "icon" ? "mr-2" : ""}`} />}
          {size !== "icon" && t("auth.logout")}
        </>
      )}
    </Button>
  )
}
