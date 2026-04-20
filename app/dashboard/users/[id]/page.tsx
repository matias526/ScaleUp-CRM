"use client"

import { useState, useEffect, useCallback, use } from "react" // 1. Importamos 'use' de React
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { type User, UserService } from "@/lib/services/user-service"
import { Edit, ArrowLeft, Mail, RefreshCw, Building2, UserCheck } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function UserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  // 3. "Desenvolvemos" los params usando el hook 'use'
  const resolvedParams = use(params)
  const id = resolvedParams.id

  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadUser = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // 4. Usamos el id ya resuelto
      const data = await UserService.getUserById(id)
      if (!data) {
        throw new Error("Usuario no encontrado")
      }
      setUser(data)
    } catch (err: any) {
      setError(err.message || "Error al cargar el usuario")
    } finally {
      setIsLoading(false)
    }
  }, [id]) // 5. Dependencia actualizada

  useEffect(() => {
    loadUser()
  }, [loadUser])

  // Función para obtener las iniciales del usuario
  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  // Función para obtener el color del rol
  const getRoleBadgeVariant = (roleCode: string | undefined) => {
    switch (roleCode) {
      case "Admin":
        return "default"
      case "BDD":
        return "secondary"
      case "TechUser":
        return "outline"
      case "PartnerUser":
        return "success"
      default:
        return "outline"
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Error</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-destructive text-lg">{error || "Usuario no encontrado"}</p>
              <Button className="mt-4" onClick={() => router.push("/dashboard/users")}>
                Volver al listado
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">
            {user.first_name} {user.last_name}
          </h1>
          <Badge variant={user.is_active ? "success" : "destructive"}>{user.is_active ? "Activo" : "Inactivo"}</Badge>
        </div>
        <Button onClick={() => router.push(`/dashboard/users/${user.id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalles del Usuario</CardTitle>
          <CardDescription>
            Información completa sobre {user.first_name} {user.last_name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center md:flex-row md:items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="text-2xl">{getUserInitials(user.first_name, user.last_name)}</AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Email</h3>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <p>{user.email}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Rol</h3>
                <Badge variant={getRoleBadgeVariant(user.role_code)}>{user.role_code}</Badge>
              </div>

              {user.tech_company_name && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Empresa Tecnológica</h3>
                  <div className="flex items-center">
                    <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                    <p>{user.tech_company_name}</p>
                  </div>
                </div>
              )}

              {user.partner_name && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Partner</h3>
                  <div className="flex items-center">
                    <UserCheck className="h-4 w-4 mr-2 text-muted-foreground" />
                    <p>{user.partner_name}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Idioma Preferido</h3>
              <p>
                {user.preferred_language === "es"
                  ? "Español"
                  : user.preferred_language === "en"
                    ? "English"
                    : user.preferred_language === "pt"
                      ? "Português"
                      : user.preferred_language}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Tema Preferido</h3>
              <p>
                {user.theme_preference === "light"
                  ? "Claro"
                  : user.theme_preference === "dark"
                    ? "Oscuro"
                    : user.theme_preference === "system"
                      ? "Sistema"
                      : user.theme_preference}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Estado</h3>
              <Badge variant={user.is_active ? "success" : "destructive"}>
                {user.is_active ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Fecha de Creación</h3>
              <p>{new Date(user.created_at).toLocaleDateString()}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Última Actualización</h3>
              <p>{new Date(user.updated_at).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/dashboard/users")}>
            Volver al listado
          </Button>
          <Button variant="outline" onClick={loadUser}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
