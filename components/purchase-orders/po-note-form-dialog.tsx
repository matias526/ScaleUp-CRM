"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { Lock, Globe } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { supabase } from "@/lib/supabase/client"

interface PONoteFormDialogProps {
  isOpen: boolean
  onClose: () => void
  poId: string
  currentUserId: string
  onNoteAdded: () => void
  userRole?: string
}

export function PONoteFormDialog({
  isOpen,
  onClose,
  poId,
  currentUserId,
  onNoteAdded,
  userRole = "",
}: PONoteFormDialogProps) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)
  const { userInfo } = useAuth()

  // Solo Admin y BDD pueden crear notas privadas
  const isScaleUpUser = userRole === "Admin" || userRole === "BDD"

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
      const { error } = await supabase
        .from("notes")
        .insert([
          {
            purchase_order_id: poId,
            user_id: currentUserId,
            content: content.trim(),
            is_private: isPrivate,
          },
        ])

      if (error) throw error

      toast({
        title: "Éxito",
        description: "Nota agregada correctamente",
      })
      
      setContent("")
      setIsPrivate(false)
      onNoteAdded()
      onClose()
    } catch (error) {
      console.error("Error adding note:", error)
      toast({
        title: "Error",
        description: "No se pudo agregar la nota",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Nota</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="note-content" className="text-sm">
              Contenido de la nota
            </Label>
            <Textarea
              id="note-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe tu nota aquí..."
              className="mt-2 min-h-24"
            />
          </div>

          {/* Solo mostrar el switch si es usuario de ScaleUp */}
          {isScaleUpUser && (
            <div className="flex items-center justify-between p-2 border rounded bg-gray-50">
              <div className="flex items-center gap-2">
                {isPrivate ? (
                  <Lock className="h-4 w-4 text-amber-600" />
                ) : (
                  <Globe className="h-4 w-4 text-green-600" />
                )}
                <Label className="text-sm font-medium">
                  {isPrivate ? "Nota privada" : "Nota pública"}
                </Label>
              </div>
              <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
            </div>
          )}

          {/* Mostrar información si no es ScaleUp user */}
          {!isScaleUpUser && (
            <div className="p-2 border rounded bg-blue-50 text-sm text-blue-700">
              <p className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Esta nota será pública
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !content.trim()}>
            {isSubmitting ? "Guardando..." : "Agregar nota"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
