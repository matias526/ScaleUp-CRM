"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface AddNoteDialogProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName: string
  meetingId?: string
  onSuccess?: () => void
}

export function AddNoteDialog({ isOpen, onClose, userId, userName, meetingId, onSuccess }: AddNoteDialogProps) {
  const [noteContent, setNoteContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!noteContent.trim()) {
      toast.error("Por favor ingresa el contenido de la nota")
      return
    }

    if (!meetingId) {
      toast.error("No se puede agregar nota sin un ID de reunión")
      return
    }

    setIsSubmitting(true)

    try {
      console.log("[v0] Creating note for user:", userId, "in meeting:", meetingId)

      const response = await fetch("/api/internal-meetings/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          meeting_id: meetingId,
          user_id: userId,
          note_content: noteContent.trim(),
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        console.log("[v0] Note created successfully:", result.data)
        toast.success("Nota agregada exitosamente")
        setNoteContent("")
        onClose()
        if (onSuccess) {
          onSuccess()
        }
      } else {
        console.error("[v0] Error creating note:", result.error)
        toast.error(result.error || "Error al crear la nota")
      }
    } catch (error) {
      console.error("[v0] Error creating note:", error)
      toast.error("Error al crear la nota")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setNoteContent("")
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Agregar Nota - {userName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="note-content">Contenido de la Nota</Label>
            <Textarea
              id="note-content"
              placeholder="Escribe aquí las observaciones, comentarios o notas sobre este usuario..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="min-h-[200px]"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500">
              Esta nota quedará registrada en la reunión y asociada al usuario {userName}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !noteContent.trim()}>
            {isSubmitting ? "Guardando..." : "Guardar Nota"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
