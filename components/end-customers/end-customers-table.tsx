"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Globe, Building, MapPin, Eye, Edit, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
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
import { deleteEndCustomer } from "@/lib/services/end-customer-service-client"
import type { EndCustomer } from "@/lib/services/end-customer-service-server"

interface EndCustomersTableProps {
  customers: EndCustomer[]
  onDelete?: () => void
  isLoading?: boolean
}

export function EndCustomersTable({ customers, onDelete, isLoading }: EndCustomersTableProps) {
  const router = useRouter()
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; customer: EndCustomer | null }>({
    open: false,
    customer: null,
  })
  const [isDeleting, setIsDeleting] = useState(false)

  const handleView = (id: string) => {
    router.push(`/dashboard/end-customers/${id}`)
  }

  const handleEdit = (id: string) => {
    router.push(`/dashboard/end-customers/${id}/edit`)
  }

  const openDeleteDialog = (customer: EndCustomer) => {
    setDeleteDialog({ open: true, customer })
  }

  const closeDeleteDialog = () => {
    setDeleteDialog({ open: false, customer: null })
  }

  const handleDelete = async () => {
    if (!deleteDialog.customer) return

    setIsDeleting(true)
    try {
      await deleteEndCustomer(deleteDialog.customer.id)
      closeDeleteDialog()
      onDelete?.()
    } catch (error) {
      console.error("Error al eliminar cliente final:", error)
      alert("Error al eliminar el cliente. Por favor, inténtalo de nuevo.")
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="border rounded-md p-8 text-center">
        <p>Buscando clientes...</p>
      </div>
    )
  }

  return (
    <>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Industria</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>ID Fiscal</TableHead>
              <TableHead className="w-[120px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No hay clientes finales registrados
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{customer.name}</span>
                      {customer.website && (
                        <a
                          href={customer.website.startsWith("http") ? customer.website : `https://${customer.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary"
                        >
                          <Globe className="h-3 w-3" />
                          {customer.website}
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {customer.industries?.name || customer.industry ? (
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <Building className="h-3 w-3" />
                        {customer.industries?.name || customer.industry}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {customer.city || customer.countries?.name ? (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{[customer.city, customer.countries?.name].filter(Boolean).join(", ")}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>{customer.tax_id || <span className="text-muted-foreground text-sm">-</span>}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleView(customer.id)} className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(customer.id)} className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(customer)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
      </div>

      <AlertDialog open={deleteDialog.open} onOpenChange={closeDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el cliente final "
              {deleteDialog.customer?.name}" y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
