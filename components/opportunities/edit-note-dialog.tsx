"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { updateNote } from "@/lib/services/notes-service"
import { toast } from "@/components/ui/use-toast"
import { Lock, Globe } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import type { Note } from "@/lib/services/notes-service"

interface EditNoteDialogProps {
  isOpen: boolean
  onClose: () => void
  note: Note | null
  isScaleUpMember?: boolean
  onNoteUpdated: () => void
}

export function EditNoteDialog({ isOpen, onClose, note, isScaleUpMember = false, onNoteUpdated }: EditNoteDialogProps) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)
  const { userInfo } = useAuth()

  // Determinar si el usuario es de ScaleUp basado en el contexto de autenticación
  const isUserScaleUp =
    userInfo?.isAdmin || userInfo?.roleCode === "Admin" || userInfo?.roleCode === "BDD" || isScaleUpMember

  // Cargar datos de la nota cuando se abre el diálogo
  useEffect(() => {
    if (isOpen && note) {
      setContent(note.content)
      setIsPrivate(note.is_private)
    }
  }, [isOpen, note])

  const handleSubmit = async () => {
    if (!note) return

    if (!content.trim()) {
      toast({
        title: "Error",
        description: "El contenido de la nota no puede estar vacío",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await updateNote(note.id, {
        content: content.trim(),
        is_private: isPrivate,
      })

      if (result) {
        toast({
          title: "Nota actualizada",
          description: "La nota se ha actualizado correctamente",
        })
        onNoteUpdated()
        onClose()
      } else {
        toast({
          title: "Error",
          description: "No se pudo actualizar la nota",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al actualizar nota:", error)
      toast({
        title: "Error",
        description: `Ocurrió un error al actualizar la nota: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar entrada de la reseña histórica</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="content">Contenido</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe el contenido de la nota..."
              className="min-h-[120px]"
            />
          </div>

          {/* Opción de privacidad - solo para usuarios de ScaleUp */}
          {isUserScaleUp && (
            <div className="flex items-center space-x-2">
              <Switch id="private-mode" checked={isPrivate} onCheckedChange={setIsPrivate} />
              <Label htmlFor="private-mode" className="flex items-center cursor-pointer">
                {isPrivate ? (
                  <>
                    <Lock className="h-4 w-4 mr-2 text-amber-500" />
                    <span>Nota interna de ScaleUp (solo visible para ScaleUp)</span>
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4 mr-2 text-green-500" />
                    <span>Nota pública (visible para todos)</span>
                  </>
                )}
              </Label>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
