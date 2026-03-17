"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useTranslations } from "@/hooks/use-translations"

type AddNoteDialogProps = {
  open: boolean
  onClose: () => void
  opportunityId: string
  onSuccess: () => void
  onAddNote?: (noteData: { content: string; is_private: boolean }) => Promise<boolean>
}

export function AddNoteDialog({ open, onClose, opportunityId, onSuccess, onAddNote }: AddNoteDialogProps) {
  const { t } = useTranslations()
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!content.trim()) return

    setIsSubmitting(true)
    try {
      // Si hay una función onAddNote proporcionada, usarla
      if (onAddNote) {
        const success = await onAddNote({
          content,
          is_private: false, // Siempre false, ya que eliminamos la opción
        })

        if (success) {
          onSuccess()
          setContent("")
        }
      } else {
        // Fallback para compatibilidad
        onSuccess()
        setContent("")
      }
    } catch (error) {
      console.error("Error al añadir nota:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("follow_up_meeting.add_note", "Añadir Nota")}</DialogTitle>
          <DialogDescription>
            Añade una nota a esta oportunidad. Las notas ayudan a mantener un registro de la comunicación.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Textarea
            placeholder="Escribe tu nota aquí..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="resize-none"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel", "Cancelar")}
          </Button>
          <Button onClick={handleSubmit} disabled={!content.trim() || isSubmitting}>
            {t("common.save", "Guardar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AddNoteDialog
