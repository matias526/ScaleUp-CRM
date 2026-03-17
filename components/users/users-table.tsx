"use client"

import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Edit, Trash2 } from "lucide-react"
import { type User as UserType, UserService } from "@/lib/services/user-service"
import { Card, CardContent } from "@/components/ui/card"
import { useState, useCallback } from "react"
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
import { useMobile } from "@/hooks/use-mobile"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTranslations } from "@/hooks/use-translations"

interface UsersTableProps {
  users: UserType[]
  onDelete: () => void
}

export function UsersTable({ users, onDelete }: UsersTableProps) {
  const router = useRouter()
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const isMobile = useMobile()

  // Definir las claves de traducción que necesitamos
  const translationKeys = [
    "users.table.avatar",
    "users.table.name",
    "users.table.email",
    "users.table.role",
    "users.table.affiliation",
    "users.table.status",
    "users.table.actions",
    "users.status.active",
    "users.status.inactive",
    "users.no_users",
    "users.delete.title",
    "users.delete.description",
    "users.delete.cancel",
    "users.delete.confirm",
    "users.delete.deleting",
  ]

  // Usar el hook de traducciones
  const { t } = useTranslations(translationKeys)

  // Funciones optimizadas con useCallback
  const handleView = useCallback(
    (id: string) => {
      router.push(`/dashboard/users/${id}`)
    },
    [router],
  )

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/dashboard/users/${id}/edit`)
    },
    [router],
  )

  const handleDelete = useCallback(async () => {
    if (!userToDelete) return

    setIsDeleting(true)
    try {
      const success = await UserService.deleteUser(userToDelete.id)
      if (success) {
        onDelete()
      } else {
        // Mostrar un mensaje de error si la eliminación falla
        console.error("No se pudo eliminar el usuario")
        // Aquí podrías agregar un toast o alguna notificación visual
      }
    } catch (error) {
      console.error("Error al eliminar usuario:", error)
      // Aquí podrías agregar un toast o alguna notificación visual
    } finally {
      setIsDeleting(false)
      setUserToDelete(null)
    }
  }, [userToDelete, onDelete])

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

  // Renderizado para móviles (vista de tarjetas)
  if (isMobile) {
    return (
      <>
        <div className="space-y-4">
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t("users.no_users")}</div>
          ) : (
            users.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <div className="flex items-center mb-4">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={user.profile_image || ""} alt={`${user.first_name} ${user.last_name}`} />
                      <AvatarFallback>{getUserInitials(user.first_name, user.last_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">
                        {user.first_name} {user.last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant={getRoleBadgeVariant(user.role_code)} className="ml-auto">
                      {user.role_code}
                    </Badge>
                  </div>

                  <div className="flex justify-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleView(user.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(user.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUserToDelete(user)}
                      className="text-destructive border-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("users.delete.title")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("users.delete.description").replace(
                  "{name}",
                  `${userToDelete?.first_name} ${userToDelete?.last_name}`,
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>{t("users.delete.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  handleDelete()
                }}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground"
              >
                {isDeleting ? t("users.delete.deleting") : t("users.delete.confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  // Renderizado para escritorio (vista de tabla)
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">{t("users.table.avatar")}</TableHead>
            <TableHead>{t("users.table.name")}</TableHead>
            <TableHead>{t("users.table.email")}</TableHead>
            <TableHead>{t("users.table.role")}</TableHead>
            <TableHead>{t("users.table.affiliation")}</TableHead>
            <TableHead>{t("users.table.status")}</TableHead>
            <TableHead className="text-right">{t("users.table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                {t("users.no_users")}
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Avatar>
                    <AvatarImage src={user.profile_image || ""} alt={`${user.first_name} ${user.last_name}`} />
                    <AvatarFallback>{getUserInitials(user.first_name, user.last_name)}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">
                  {user.first_name} {user.last_name}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(user.role_code)}>{user.role_code}</Badge>
                </TableCell>
                <TableCell>
                  {user.tech_company_name ? (
                    <span className="text-sm">{user.tech_company_name}</span>
                  ) : user.partner_name ? (
                    <span className="text-sm">{user.partner_name}</span>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={user.is_active ? "success" : "destructive"}>
                    {user.is_active ? t("users.status.active") : t("users.status.inactive")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleView(user.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(user.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUserToDelete(user)}
                      className="text-destructive border-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("users.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("users.delete.description").replace(
                "{name}",
                `${userToDelete?.first_name} ${userToDelete?.last_name}`,
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t("users.delete.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground"
            >
              {isDeleting ? t("users.delete.deleting") : t("users.delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
