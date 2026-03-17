"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export function UserDebugInfo() {
  const { user, userInfo, loading } = useAuth()

  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Cargando información del usuario...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Información de depuración del usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">No hay usuario autenticado</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Información de depuración del usuario</CardTitle>
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
    </Card>
  )
}
