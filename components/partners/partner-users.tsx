"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { UserPlus } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"
//import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { supabase } from "@/lib/supabase/client"

interface PartnerUsersProps {
  partnerId: string
  partnerName?: string
}

export function PartnerUsers({ partnerId, partnerName }: PartnerUsersProps) {
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslations()
  //const supabase = createClientComponentClient()

  const loadUsers = async () => {
    if (!partnerId) return

    setIsLoading(true)
    setError(null)

    try {
      // Consulta directa a Supabase
      const { data, error: supabaseError } = await supabase
        .from("users")
        .select(`
          id, email, first_name, last_name, is_active,
          roles:role_id (code)
        `)
        .eq("partner_id", partnerId)

      if (supabaseError) throw new Error(supabaseError.message)

      setUsers(data || [])
    } catch (err: any) {
      console.error("Error al cargar usuarios:", err)
      setError(err.message || "Error al cargar usuarios")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [partnerId])

  const handleCreateUser = () => {
    router.push(`/dashboard/users/create?partner_id=${partnerId}`)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t("partner_users") || "Usuarios del Partner"}</CardTitle>
          <CardDescription>
            {partnerName
              ? t("users_associated_with_partner", { name: partnerName }) || `Usuarios asociados con ${partnerName}`
              : t("users_associated_with_this_partner") || "Usuarios asociados con este partner"}
          </CardDescription>
        </div>
        <Button onClick={handleCreateUser}>
          <UserPlus className="mr-2 h-4 w-4" />
          {t("add_user") || "Añadir Usuario"}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-4 text-destructive">{error}</div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{t("no_users_for_partner") || "No hay usuarios registrados para este partner"}</p>
            <Button onClick={handleCreateUser} variant="outline" className="mt-4">
              <UserPlus className="mr-2 h-4 w-4" />
              {t("add_first_user") || "Añadir primer usuario"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-md hover:bg-muted/50 transition-colors"
                onClick={() => router.push(`/dashboard/users/${user.id}`)}
                style={{ cursor: "pointer" }}
              >
                <div>
                  <div className="font-medium">
                    {user.first_name} {user.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
                <div
                  className={`px-2 py-1 text-xs rounded-full ${user.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                >
                  {user.is_active ? t("users.status.active") || "Activo" : t("users.status.inactive") || "Inactivo"}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
