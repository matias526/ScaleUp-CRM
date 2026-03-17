"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export default function DebugLoginPage() {
  const { user, userInfo, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [redirectTo, setRedirectTo] = useState("/dashboard")
  const [loadingUserInfo, setLoadingUserInfo] = useState(true)

  useEffect(() => {
    // Obtener el parámetro de redirección
    const redirect = searchParams?.get("redirect")
    if (redirect) {
      setRedirectTo(redirect)
    }

    // Dar tiempo para que se cargue la información del usuario
    const timer = setTimeout(() => {
      setLoadingUserInfo(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [searchParams])

  // Si no hay usuario autenticado, redirigir al login
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [loading, user, router])

  const handleContinue = () => {
    router.push(redirectTo)
  }

  if (loading || loadingUserInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Cargando información del usuario</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center">Información de depuración del usuario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted p-4">
            <h3 className="mb-2 font-semibold">Información básica</h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div>
                <strong>ID:</strong> {user?.id}
              </div>
              <div>
                <strong>Email:</strong> {user?.email}
              </div>
              <div>
                <strong>Nombre:</strong> {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
              </div>
              <div>
                <strong>Último login:</strong> {new Date(user?.last_sign_in_at || "").toLocaleString()}
              </div>
            </div>
          </div>

          <div className="rounded-md bg-muted p-4">
            <h3 className="mb-2 font-semibold">Roles y permisos</h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div>
                <strong>Es administrador:</strong> {userInfo?.isAdmin ? "Sí" : "No"}
              </div>
              <div>
                <strong>Rol del usuario:</strong> {userInfo?.role || "No definido"}
              </div>
              <div>
                <strong>Idioma preferido:</strong> {userInfo?.language || "No definido"}
              </div>
              <div>
                <strong>Es usuario ScaleUp:</strong> {userInfo?.isScaleUp ? "Sí" : "No"}
              </div>
            </div>
          </div>

          <div className="rounded-md bg-muted p-4">
            <h3 className="mb-2 font-semibold">Afiliaciones</h3>
            <div className="grid grid-cols-1 gap-2">
              <div>
                <strong>Partner:</strong>{" "}
                {userInfo?.partnerId
                  ? `${userInfo.partnerName} (ID: ${userInfo.partnerId})`
                  : "No pertenece a ningún partner"}
              </div>
              <div>
                <strong>Tech Company:</strong>{" "}
                {userInfo?.techCompanyId
                  ? `${userInfo.techCompanyName} (ID: ${userInfo.techCompanyId})`
                  : "No pertenece a ninguna tech company"}
              </div>
              <div>
                <strong>Países del partner ({userInfo?.partnerCountries?.length || 0}):</strong>
                <div className="mt-1 flex flex-wrap gap-1">
                  {userInfo?.partnerCountries?.length ? (
                    userInfo.partnerCountries.map((country) => (
                      <span key={country} className="rounded bg-primary/10 px-2 py-1 text-xs">
                        {country}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground">Ninguno</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleContinue} className="w-full">
            Continuar al dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
