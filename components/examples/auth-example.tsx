"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck, Users, Building, AlertCircle } from "lucide-react"

export function AuthExample() {
  const { userInfo, loading } = useAuth()

  if (loading) {
    return <div>Cargando información del usuario...</div>
  }

  if (!userInfo) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No autenticado</AlertTitle>
        <AlertDescription>No hay un usuario autenticado o no se pudo cargar la información.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" /> Permisos y Acceso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Acceso de administrador:</span>
              {userInfo.isAdmin ? (
                <Badge variant="default">Habilitado</Badge>
              ) : (
                <Badge variant="outline">No disponible</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span>Rol:</span>
              <Badge variant="secondary">{userInfo.roleCode}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" /> Afiliaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {userInfo.isScaleUp ? (
              <div className="rounded-md bg-blue-50 p-2 dark:bg-blue-900">
                <span className="font-medium text-blue-800 dark:text-blue-200">Usuario ScaleUp</span>
              </div>
            ) : (
              <>
                {userInfo.partnerId && (
                  <div className="flex items-center justify-between">
                    <span>Partner:</span>
                    <Badge variant="default">{userInfo.partnerName}</Badge>
                  </div>
                )}
                {userInfo.techCompanyId && (
                  <div className="flex items-center justify-between">
                    <span>Tech Company:</span>
                    <Badge variant="default">{userInfo.techCompanyName}</Badge>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {userInfo.partnerId && userInfo.partnerCountries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Países del Partner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {userInfo.partnerCountries.map((country) => (
                <Badge key={country.country_id} variant="outline">
                  {country.code}: {country.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
