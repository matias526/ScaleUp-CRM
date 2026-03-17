"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Lock, RefreshCw } from "lucide-react"
import { NoteFormDialog } from "./note-form-dialog"
import { getNotesByOpportunityId, deleteNote, addDebugLog, type Note } from "@/lib/services/notes-service"
import { toast } from "@/components/ui/use-toast"
import { OrganizationAvatar } from "./organization-avatar"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import NotesQueryDebug from "@/components/debug/notes-query-debug"

interface OpportunityNotesProps {
  opportunityId: string
  currentUserId: string
  isScaleUpMember?: boolean
}

export function OpportunityNotesSimple({
  opportunityId,
  currentUserId,
  isScaleUpMember = false,
}: OpportunityNotesProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({})
  const [refreshKey, setRefreshKey] = useState(0)

  const loadNotes = async () => {
    setIsLoading(true)
    try {
      addDebugLog(`=== CARGANDO NOTAS SIMPLE (${refreshKey}) ===`, "info")
      const fetchedNotes = await getNotesByOpportunityId(opportunityId, currentUserId)

      console.log("NOTAS RECIBIDAS EN COMPONENTE SIMPLE:", fetchedNotes)

      setNotes(fetchedNotes)
    } catch (error) {
      console.error("Error al cargar notas:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las notas",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  useEffect(() => {
    loadNotes()
  }, [opportunityId, currentUserId, refreshKey])

  const handleDeleteNote = async (noteId: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta nota?")) {
      setIsDeleting((prev) => ({ ...prev, [noteId]: true }))
      try {
        const success = await deleteNote(noteId)
        if (success) {
          setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId))
          toast({
            title: "Nota eliminada",
            description: "La nota se ha eliminado correctamente",
          })
        } else {
          toast({
            title: "Error",
            description: "No se pudo eliminar la nota",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error al eliminar nota:", error)
        toast({
          title: "Error",
          description: "Ocurrió un error al eliminar la nota",
          variant: "destructive",
        })
      } finally {
        setIsDeleting((prev) => ({ ...prev, [noteId]: false }))
      }
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Reseña histórica (Vista Simple)</CardTitle>
        <div className="flex space-x-2">
          <Button onClick={handleRefresh} size="sm" variant="outline" title="Recargar notas">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            Agregar entrada
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Cargando notas...</div>
        ) : notes.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No hay entradas en la reseña histórica</div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mb-4">
              <h3 className="font-bold">Notas cargadas: {notes.length}</h3>
              <p className="text-sm">Esta vista simplificada no usa ReactMarkdown para renderizar el contenido.</p>
            </div>

            {notes.map((note, index) => (
              <div key={note.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <OrganizationAvatar
                      user={note.user}
                      className="h-8 w-8"
                      fallbackClassName="h-8 w-8"
                      fallback={note.user?.first_name?.[0] || "U"}
                    />
                    <div>
                      <div className="font-medium">
                        {note.user?.first_name} {note.user?.last_name}
                        {note.is_private && (
                          <span className="ml-2 inline-flex items-center">
                            <Lock className="h-3 w-3 text-amber-500" />
                            <span className="ml-1 text-xs text-amber-500">Privada</span>
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(note.created_at), { addSuffix: true, locale: es })}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-2 p-2 bg-gray-50 rounded">
                  {/* Renderizado simple sin ReactMarkdown */}
                  <pre className="whitespace-pre-wrap text-sm">{note.content}</pre>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  ID: {note.id} | Privada: {note.is_private ? "Sí" : "No"}
                </div>
              </div>
            ))}
          </div>
        )}

        <NotesQueryDebug opportunityId={opportunityId} />
      </CardContent>

      <NoteFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        opportunityId={opportunityId}
        currentUserId={currentUserId}
        isScaleUpMember={isScaleUpMember}
        onNoteAdded={loadNotes}
      />
    </Card>
  )
}
