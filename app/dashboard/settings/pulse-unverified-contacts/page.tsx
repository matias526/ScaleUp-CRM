"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { UnverifiedContactsManager } from "@/components/pulse/unverified-contacts-manager"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useTranslation } from "@/hooks/use-translations"

export default function PulseUnverifiedContactsPage() {
  const { userInfo } = useAuth()
  const { t } = useTranslation()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  // Validar acceso restringido para Admin o Marketing
  useEffect(() => {
    const checkAccess = async () => {
      setLoading(true)
      const isAdmin = userInfo?.isAdmin || false
      const isMarketing = userInfo?.roleCode?.toLowerCase() === "marketing" || false

      if (!isAdmin && !isMarketing) {
        // Usuario no autorizado, redirigir después de 2 segundos
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        setAuthorized(true)
      }

      setLoading(false)
    }

    if (userInfo) {
      checkAccess()
    }
  }, [userInfo, router])

  // Mostrar pantalla de carga mientras se verifica acceso
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="py-8">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <p className="text-center text-gray-600">{t("common.checking_permissions", "Verificando permisos...")}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Mostrar pantalla de acceso denegado
  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md border-red-300">
          <CardContent className="py-8">
            <p className="text-red-600 mb-4">
              {t(
                "pulse.access_denied_message",
                "No tienes permisos para acceder a esta sección. Solo administradores y usuarios de marketing pueden gestionar Contactos No Verificados.",
              )}
            </p>
            <Button onClick={() => router.push("/dashboard")} className="w-full">
              {t("common.back_to_dashboard", "Volver al Dashboard")}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <UnverifiedContactsManager />
    </div>
  )
}
