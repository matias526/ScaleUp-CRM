"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Eye, Edit, Trash2 } from "lucide-react"
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

interface ActionButtonsProps {
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  itemName?: string
}

export function ActionButtons({ onView, onEdit, onDelete, itemName = "este elemento" }: ActionButtonsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = useCallback(async () => {
    if (!onDelete) return

    setIsDeleting(true)
    try {
      await onDelete()
    } catch (error) {
      console.error("Error al eliminar:", error)
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }, [onDelete])

  const handleEdit = useCallback(() => {
    if (onEdit) {
      onEdit()
    }
  }, [onEdit])

  const handleView = useCallback(() => {
    if (onView) {
      onView()
    }
  }, [onView])

  return (
    <div className="flex items-center space-x-2">
      {onView && (
        <Button variant="outline" size="sm" onClick={handleView} className="flex items-center">
          <Eye className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Ver</span>
        </Button>
      )}

      {onEdit && (
        <Button variant="outline" size="sm" onClick={handleEdit} className="flex items-center">
          <Edit className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Editar</span>
        </Button>
      )}

      {onDelete && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            className="flex items-center text-destructive border-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Eliminar</span>
          </Button>

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará permanentemente {itemName}. Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault()
                    handleDelete()
                  }}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? "Eliminando..." : "Eliminar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  )
}
