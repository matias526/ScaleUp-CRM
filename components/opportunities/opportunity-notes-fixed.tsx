"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Trash2, Lock, RefreshCw, Edit } from "lucide-react"
import { NoteFormDialog } from "./note-form-dialog"
import { EditNoteDialog } from "./edit-note-dialog"
import { deleteNote, type Note, isScaleUpMember } from "@/lib/services/notes-service"
import { toast } from "@/components/ui/use-toast"
import { NoteContent } from "./note-content"
import { OrganizationAvatar } from "./organization-avatar"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
//import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { supabase } from "@/lib/supabase/client"
import { format } from "date-fns"

interface OpportunityNotesProps {
  opportunityId: string
}

export function OpportunityNotesFixed({ opportunityId }: OpportunityNotesProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({})
  const [refreshKey, setRefreshKey] = useState(0)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isUserScaleUp, setIsUserScaleUp] = useState<boolean>(false)
  //const supabase = createClientComponentClient()

  // Obtener el usuario actual y verificar si es ScaleUp
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        // Obtener el usuario actual
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          console.error("No se pudo obtener el usuario actual")
          return
        }

        setCurrentUser(user)

        // Verificar si el usuario es ScaleUp
        const scaleUpStatus = await isScaleUpMember(user.id)
        setIsUserScaleUp(scaleUpStatus)
      } catch (error) {
        console.error("Error al obtener el usuario actual:", error)
      }
    }

    getCurrentUser()
  }, [supabase])

  const loadNotes = async () => {
    if (!currentUser) return // No cargar notas si no hay usuario

    setIsLoading(true)
    try {
      // Obtener notas directamente de Supabase
      let query = supabase
        .from("notes")
        .select(`
          *,
          user:users(id, first_name, last_name, email, role_id, partner_id, tech_company_id)
        `)
        .eq("opportunity_id", opportunityId)

      // Aplicar filtro solo si no es ScaleUp
      if (!isUserScaleUp) {
        query = query.eq("is_private", false)
      }

      // Ejecutar consulta
      const { data: fetchedNotes, error } = await query.order("created_at", { ascending: false })

      if (error) {
        console.error("Error al obtener notas:", error)
        return
      }

      setNotes(fetchedNotes || [])
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

  // Cargar notas cuando cambie el usuario o la oportunidad
  useEffect(() => {
    if (currentUser) {
      loadNotes()
    }
  }, [opportunityId, currentUser, isUserScaleUp, refreshKey])

  const handleDeleteNote = async (noteId: string) => {
    if (!currentUser) return // No permitir eliminar si no hay usuario

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

  const handleEditNote = (note: Note) => {
    setSelectedNote(note)
    setIsEditDialogOpen(true)
  }

  const canEditNote = (note: Note) => {
    // Solo el creador de la nota o un miembro de ScaleUp puede editar notas
    return currentUser && (note.user_id === currentUser.id || isUserScaleUp)
  }

  const canDeleteNote = (note: Note) => {
    // Solo el creador de la nota o un miembro de ScaleUp puede eliminar notas
    return currentUser && (note.user_id === currentUser.id || isUserScaleUp)
  }

  const formatNoteDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Fecha desconocida"
    try {
      return format(new Date(dateString), "PPP", { locale: es })
    } catch (error) {
      console.error("Error al formatear fecha:", error)
      return "Fecha inválida"
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Reseña histórica</CardTitle>
        <div className="flex space-x-2">
          <Button onClick={handleRefresh} size="sm" variant="outline" title="Recargar notas">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} size="sm" disabled={!currentUser}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Agregar entrada
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!currentUser ? (
          <div className="text-center py-4">Cargando información de usuario...</div>
        ) : isLoading ? (
          <div className="text-center py-4">Cargando notas...</div>
        ) : notes.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No hay entradas en la reseña histórica</div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
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
                        {note.created_at
                          ? formatDistanceToNow(new Date(note.created_at), { addSuffix: true, locale: es })
                          : "Fecha desconocida"}
                        {note.updated_at && note.updated_at !== note.created_at && (
                          <span className="ml-2 italic">(editada)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    {canEditNote(note) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditNote(note)}
                        title="Editar nota"
                      >
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                    {canDeleteNote(note) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeleteNote(note.id)}
                        disabled={isDeleting[note.id]}
                        title="Eliminar nota"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-2">
                  <NoteContent
                    content={note.content}
                    onClick={() => canEditNote(note) && handleEditNote(note)}
                    isEditable={canEditNote(note)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {currentUser && (
        <>
          <NoteFormDialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            opportunityId={opportunityId}
            currentUserId={currentUser.id}
            isScaleUpMember={isUserScaleUp}
            onNoteAdded={loadNotes}
          />
          <EditNoteDialog
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false)
              setSelectedNote(null)
            }}
            note={selectedNote}
            isScaleUpMember={isUserScaleUp}
            onNoteUpdated={loadNotes}
          />
        </>
      )}
    </Card>
  )
}
