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
import { useTranslations } from "@/hooks/use-translations"
import { DICT_LANG_PO } from "@/lib/constants/dict-lang-po"

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
  const { t } = useTranslations(DICT_LANG_PO)

  // Solo Admin y BDD pueden crear notas privadas
  const isScaleUpUser = userRole === "Admin" || userRole === "BDD"

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: t("common.error"),
        description: t("po.notes.dialog.contentEmpty"),
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
        title: t("po.notes.dialog.successTitle"),
        description: t("po.notes.dialog.successMessage"),
      })
      
      setContent("")
      setIsPrivate(false)
      onNoteAdded()
      onClose()
    } catch (error) {
      console.error("Error adding note:", error)
      toast({
        title: t("common.error"),
        description: t("po.notes.dialog.errorMessage"),
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
          <DialogTitle>{t("po.notes.dialog.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="note-content" className="text-sm">
              {t("po.notes.dialog.contentLabel")}
            </Label>
            <Textarea
              id="note-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("po.notes.dialog.contentPlaceholder")}
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
                  {isPrivate ? t("po.notes.dialog.privateNote") : t("po.notes.dialog.publicNote")}
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
                {t("po.notes.dialog.publicInfo")}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t("po.notes.dialog.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !content.trim()}>
            {isSubmitting ? t("po.notes.dialog.submitting") : t("po.notes.dialog.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
