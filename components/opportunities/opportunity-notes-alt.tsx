"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Trash2, Lock, RefreshCw } from "lucide-react"
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

export function OpportunityNotesAlt({ opportunityId, currentUserId, isScaleUpMember = false }: OpportunityNotesProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({})
  const [refreshKey, setRefreshKey] = useState(0)
  const [debugMode, setDebugMode] = useState(false)

  const loadNotes = async () => {
    setIsLoading(true)
    try {
      addDebugLog(`=== CARGANDO NOTAS ALT (${refreshKey}) ===`, "info")
      addDebugLog(`Cargando notas para oportunidad: ${opportunityId}`, "info")
      const fetchedNotes = await getNotesByOpportunityId(opportunityId, currentUserId)

      // Añadir logs detallados para depuración
      console.log("TODAS LAS NOTAS RECIBIDAS (ALT):", fetchedNotes)
      addDebugLog(`Notas recibidas del servicio: ${fetchedNotes.length}`, "info")
      fetchedNotes.forEach((note, index) => {
        addDebugLog(`Nota ${index + 1}: ID=${note.id}, Privada=${note.is_private}, Usuario=${note.user_id}`, "info")
        console.log(`Contenido de nota ${index + 1}:`, note.content)
      })

      // IMPORTANTE: No filtrar las notas aquí, usar directamente las que vienen del servicio
      setNotes(fetchedNotes)
      addDebugLog(`Notas cargadas y establecidas en el estado: ${fetchedNotes.length}`, "success")
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

  // Forzar recarga de notas
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

  const canDeleteNote = (note: Note) => {
    // Solo el creador de la nota o un miembro de ScaleUp puede eliminar notas
    return note.user_id === currentUserId || isScaleUpMember
  }

  // Función para formatear el texto con saltos de línea
  const formatText = (text: string) => {
    return text.split("\n").map((line, i) => (
      <span key={i}>
        {line}
        <br />
      </span>
    ))
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Reseña histórica (Vista Alternativa)</CardTitle>
        <div className="flex space-x-2">
          <Button onClick={() => setDebugMode(!debugMode)} size="sm" variant="outline" title="Modo debug">
            {debugMode ? "Ocultar Debug" : "Mostrar Debug"}
          </Button>
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
          <>
            {debugMode && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-md">
                <h3 className="font-bold mb-2">Debug de Notas:</h3>
                <p className="text-sm mb-2">Total de notas: {notes.length}</p>
                <pre className="text-xs overflow-auto max-h-40">{JSON.stringify(notes, null, 2)}</pre>
              </div>
            )}
            <div className="space-y-4">
              {/* IMPORTANTE: Mostrar todas las notas sin filtrar */}
              {notes.map((note, index) => (
                <div key={note.id} className="border rounded-lg p-4" data-note-id={note.id}>
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
                    {canDeleteNote(note) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeleteNote(note.id)}
                        disabled={isDeleting[note.id]}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div className="mt-2 whitespace-pre-wrap">
                    {/* Usar texto plano con formato básico */}
                    {formatText(note.content)}
                  </div>
                  {debugMode && (
                    <div className="mt-2 text-xs text-gray-500">
                      ID: {note.id} | Privada: {note.is_private ? "Sí" : "No"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Añadir el componente de depuración */}
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
