"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "@/hooks/use-translations"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AddUserToTechCompanyDialog } from "./add-user-to-tech-company-dialog"
import { supabase } from "@/lib/supabase/client"

interface TechCompanyUsersProps {
  techCompanyId: string
  techCompanyName?: string | null
}

export function TechCompanyUsers({ techCompanyId, techCompanyName = "" }: TechCompanyUsersProps) {
  const { t } = useTranslations()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, email, profile_image")
        .eq("tech_company_id", techCompanyId)

      if (error) {
        console.error("Error fetching users:", error)
        return
      }

      setUsers(data || [])
    } catch (error) {
      console.error("Unexpected error:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [techCompanyId])

  const handleUserAdded = () => {
    fetchUsers()
  }

  // Asegurarse de que techCompanyName sea una cadena
  const safeCompanyName = typeof techCompanyName === "string" ? techCompanyName : ""

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("tech_company_users", "Usuarios")}</CardTitle>
        <Button onClick={() => setIsDialogOpen(true)} variant="outline">
          {t("add_user", "Añadir Usuario")}
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">{t("loading", "Cargando...")}</div>
        ) : users.length === 0 ? (
          <div className="text-center py-4">{t("no_users", "No hay usuarios asociados")}</div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => {
              // Asegurarse de que todos los valores sean cadenas
              const firstName = typeof user.first_name === "string" ? user.first_name : ""
              const lastName = typeof user.last_name === "string" ? user.last_name : ""
              const email = typeof user.email === "string" ? user.email : ""
              const profileImage = typeof user.profile_image === "string" ? user.profile_image : ""

              // Crear iniciales seguras
              const initials = `${firstName.charAt(0) || ""}${lastName.charAt(0) || ""}`.toUpperCase()

              return (
                <div key={user.id} className="flex items-center space-x-4 p-2 rounded-lg hover:bg-gray-50">
                  <Avatar>
                    <AvatarImage src={profileImage || "/placeholder.svg"} alt={`${firstName} ${lastName}`} />
                    <AvatarFallback>{initials || "??"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{`${firstName} ${lastName}`}</p>
                    <p className="text-sm text-gray-500">{email}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      <AddUserToTechCompanyDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        techCompanyId={techCompanyId}
        techCompanyName={safeCompanyName}
        onUserAdded={handleUserAdded}
      />
    </Card>
  )
}
