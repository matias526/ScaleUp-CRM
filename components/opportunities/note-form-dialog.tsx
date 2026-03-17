"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { createNote as createNoteApi } from "@/lib/services/notes-service-api"
import { toast } from "@/components/ui/use-toast"
import { Lock, Globe } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"

interface NoteFormDialogProps {
  isOpen: boolean
  onClose: () => void
  opportunityId: string
  currentUserId: string
  isScaleUpMember?: boolean
  onNoteAdded: () => void
}

export function NoteFormDialog({
  isOpen,
  onClose,
  opportunityId,
  currentUserId,
  isScaleUpMember = false,
  onNoteAdded,
}: NoteFormDialogProps) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)
  const { userInfo } = useAuth()

  // Determinar si el usuario es de ScaleUp basado en el contexto de autenticación
  const isUserScaleUp =
    userInfo?.isAdmin || userInfo?.roleCode === "Admin" || userInfo?.roleCode === "BDD" || isScaleUpMember

  // Para depuración - mostrar en consola información del usuario
  useEffect(() => {
    if (isOpen) {
      console.log("NoteFormDialog - Props isScaleUpMember:", isScaleUpMember)
      console.log("NoteFormDialog - Auth userInfo:", userInfo)
      console.log("NoteFormDialog - isUserScaleUp (calculado):", isUserScaleUp)
    }
  }, [isOpen, isScaleUpMember, userInfo, isUserScaleUp])

  const handleSubmit = async () => {
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
      // Añadir más logs para depuración
      console.log("Enviando datos de nota:", {
        opportunity_id: opportunityId,
        content: content.trim(),
        is_private: isPrivate,
      })

      // Usar la API en lugar del servicio directo de Supabase
      const result = await createNoteApi({
        opportunity_id: opportunityId,
        content: content.trim(),
        is_private: isPrivate,
      })

      console.log("Resultado de createNoteApi:", result)

      if (result) {
        toast({
          title: "Nota agregada",
          description: "La nota se ha agregado correctamente",
        })
        setContent("")
        setIsPrivate(false)
        onNoteAdded()
        onClose()
      } else {
        toast({
          title: "Error",
          description: "No se pudo agregar la nota. Verifica la consola para más detalles.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al agregar nota:", error)
      toast({
        title: "Error",
        description: `Ocurrió un error al agregar la nota: ${error instanceof Error ? error.message : String(error)}`,
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
          <DialogTitle>Agregar entrada a la reseña histórica</DialogTitle>
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

          {/* Información de depuración - solo visible en desarrollo */}
          {process.env.NODE_ENV === "development" && (
            <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
              <p>Debug: isScaleUpMember (prop) = {isScaleUpMember ? "true" : "false"}</p>
              <p>Debug: userInfo.roleCode = {userInfo?.roleCode || "undefined"}</p>
              <p>Debug: isUserScaleUp (calculado) = {isUserScaleUp ? "true" : "false"}</p>
              <p>Debug: isPrivate (estado actual) = {isPrivate ? "true" : "false"}</p>
            </div>
          )}

          {/* Opción de privacidad - usando la lógica mejorada */}
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
            {isSubmitting ? "Guardando..." : "Guardar nota"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
