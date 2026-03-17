"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserPlus, Trash2, Loader2, AlertTriangle, Phone, Mail } from "lucide-react"
import { AddPartnerUserDialog } from "./add-partner-user-dialog"
import { EditPartnerUserDialog } from "./edit-partner-user-dialog"
//import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { supabase } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { UserService } from "@/lib/services/user-service"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  role_id: string
  role_code?: string
  partner_id: string | null
  phone?: string | null
}

interface PartnerUsersSimpleProps {
  partnerId: string
  partnerName?: string
}

export function PartnerUsersSimple({ partnerId, partnerName = "este partner" }: PartnerUsersSimpleProps) {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  //const supabase = createClientComponentClient()

  // Estado para el diálogo de confirmación de eliminación
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadUsers = async () => {
    if (!partnerId) return

    setIsLoading(true)
    setError(null)

    try {
      // Consulta directa a Supabase
      const { data, error: supabaseError } = await supabase
        .from("users")
        .select(`
          id, email, first_name, last_name, is_active, phone, role_id, partner_id,
          roles:role_id (code)
        `)
        .eq("partner_id", partnerId)
        .order("first_name")

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

  const handleUserAdded = () => {
    loadUsers()
  }

  const handleUserUpdated = () => {
    loadUsers()
  }

  const confirmDeleteUser = (user: User) => {
    setUserToDelete(user)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    setIsDeleting(true)
    try {
      const success = await UserService.deleteUser(userToDelete.id)

      if (success) {
        toast({
          title: "Usuario eliminado",
          description: `El usuario ${userToDelete.first_name} ${userToDelete.last_name} ha sido eliminado correctamente.`,
        })
        // Actualizar la lista de usuarios
        setUsers(users.filter((user) => user.id !== userToDelete.id))
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el usuario. Inténtalo de nuevo.",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      console.error("Error al eliminar usuario:", err)
      toast({
        title: "Error",
        description: err.message || "Error al eliminar usuario",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Usuarios del Partner</CardTitle>
            <CardDescription>Usuarios asociados con {partnerName}</CardDescription>
          </div>
          <AddPartnerUserDialog partnerId={partnerId} partnerName={partnerName} onUserAdded={handleUserAdded} />
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
              <p>No hay usuarios registrados para este partner</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => document.querySelector<HTMLButtonElement>('[data-dialog-trigger="true"]')?.click()}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Añadir primer usuario
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <div className="font-medium">
                      {user.first_name} {user.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center mt-1">
                      <Mail className="h-3.5 w-3.5 mr-1" />
                      {user.email}
                    </div>
                    {user.phone && (
                      <div className="text-sm text-muted-foreground flex items-center mt-1">
                        <Phone className="h-3.5 w-3.5 mr-1" />
                        {user.phone}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`px-2 py-1 text-xs rounded-full ${
                        user.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.is_active ? "Activo" : "Inactivo"}
                    </div>
                    <EditPartnerUserDialog user={user} onUserUpdated={handleUserUpdated} />
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => confirmDeleteUser(user)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de confirmación para eliminar usuario */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente al usuario{" "}
              <span className="font-medium">
                {userToDelete?.first_name} {userToDelete?.last_name}
              </span>{" "}
              y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteUser()
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Eliminar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Añadir exportación por defecto para resolver el error
export default PartnerUsersSimple
