"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Trash2, Lock, RefreshCw } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { useTranslations } from "@/hooks/use-translations"
import { DICT_LANG_PO } from "@/lib/constants/dict-lang-po"

interface PONotesProps {
  poId: string
  currentUserId: string
  isScaleUpMember?: boolean
}

interface Note {
  id: string
  content: string
  is_private: boolean
  created_at: string
  user_id: string
  user?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
}

export function PONotes({ poId, currentUserId, isScaleUpMember = false }: PONotesProps) {
  const { t } = useTranslations(DICT_LANG_PO)
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [noteContent, setNoteContent] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({})
  const [isPrivate, setIsPrivate] = useState(false)

  useEffect(() => {
    loadNotes()
  }, [poId, currentUserId])

  const loadNotes = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from("notes")
        .select(
          `
          *,
          user:users(id, first_name, last_name, email)
        `
        )
        .eq("purchase_order_id", poId)

      // Filter private notes if not ScaleUp member
      if (!isScaleUpMember) {
        query = query.eq("is_private", false)
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) throw error
      setNotes(data || [])
    } catch (error) {
      console.error("Error loading PO notes:", error)
      toast({
        title: "Error",
        description: t("common.error"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!noteContent.trim()) {
      toast({
        title: "Error",
        description: "La nota no puede estar vacía",
        variant: "destructive",
      })
      return
    }

    setIsAdding(true)
    try {
      const { error } = await supabase.from("notes").insert([
        {
          content: noteContent,
          is_private: isPrivate,
          user_id: currentUserId,
          purchase_order_id: poId,
        },
      ])

      if (error) throw error

      setNoteContent("")
      setIsPrivate(false)
      await loadNotes()
      toast({
        title: "Éxito",
        description: "Nota agregada correctamente",
      })
    } catch (error) {
      console.error("Error adding note:", error)
      toast({
        title: "Error",
        description: "No se pudo agregar la nota",
        variant: "destructive",
      })
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta nota?")) return

    setIsDeleting((prev) => ({ ...prev, [noteId]: true }))
    try {
      const { error } = await supabase.from("notes").delete().eq("id", noteId)

      if (error) throw error

      setNotes((prev) => prev.filter((n) => n.id !== noteId))
      toast({
        title: "Éxito",
        description: "Nota eliminada correctamente",
      })
    } catch (error) {
      console.error("Error deleting note:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la nota",
        variant: "destructive",
      })
    } finally {
      setIsDeleting((prev) => ({ ...prev, [noteId]: false }))
    }
  }

  const canDeleteNote = (note: Note) => {
    return note.user_id === currentUserId || isScaleUpMember
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg">{t("po.notes.title") || "Notas"}</CardTitle>
        <Button onClick={loadNotes} size="sm" variant="outline" title="Recargar">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-4">
        {/* Add Note Form */}
        <div className="border rounded-lg p-3 space-y-2">
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Agregar una nota..."
            className="w-full p-2 border rounded text-sm resize-none"
            rows={3}
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4"
              />
              <Lock className="h-3 w-3" />
              <span>Privada (solo Admin/BDD)</span>
            </label>
            <Button
              onClick={handleAddNote}
              size="sm"
              disabled={isAdding || !noteContent.trim()}
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </div>
        </div>

        {/* Notes List */}
        {isLoading ? (
          <div className="text-center py-4 text-gray-500 text-sm">Cargando notas...</div>
        ) : notes.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">No hay notas aún</div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="border rounded-lg p-3 text-sm space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">
                      {note.user?.first_name} {note.user?.last_name}
                      {note.is_private && (
                        <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
                          <Lock className="h-3 w-3" />
                          Privada
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(note.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </div>
                  </div>
                  {canDeleteNote(note) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleDeleteNote(note.id)}
                      disabled={isDeleting[note.id]}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>
                <div className="text-gray-700 whitespace-pre-wrap">{note.content}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
