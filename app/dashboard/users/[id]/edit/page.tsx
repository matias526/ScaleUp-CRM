"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { UserService } from "@/lib/services/user-service"
import { UserForm } from "@/components/users/user-form"

export default function EditUserPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar datos del usuario
  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true)
        const data = await UserService.getUserById(params.id)
        if (!data) {
          throw new Error("No se pudo cargar el usuario")
        }
        setUser(data)
      } catch (err: any) {
        setError(err.message || "Error al cargar el usuario")
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [params.id])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Editar Usuario</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
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
          <h1 className="text-3xl font-bold">Editar Usuario</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertDescription>{error || "No se pudo cargar el usuario"}</AlertDescription>
            </Alert>
            <div className="flex justify-center mt-4">
              <Button onClick={() => router.back()}>Volver</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Editar Usuario</h1>
      </div>
      <UserForm userId={params.id} initialData={user} />
    </div>
  )
}
