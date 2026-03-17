"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Trash2, Lock, RefreshCw, AlertTriangle } from "lucide-react"
import { NoteFormDialog } from "./note-form-dialog"
import { getNotesByOpportunityId, deleteNote, addDebugLog, type Note } from "@/lib/services/notes-service"
import { toast } from "@/components/ui/use-toast"
import { OrganizationAvatar } from "./organization-avatar"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import NotesQueryDebug from "@/components/debug/notes-query-debug"
import ReactMarkdown from "react-markdown"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface OpportunityNotesProps {
  opportunityId: string
  currentUserId: string
  isScaleUpMember?: boolean
}

export function OpportunityNotes({ opportunityId, currentUserId, isScaleUpMember = false }: OpportunityNotesProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({})
  const [refreshKey, setRefreshKey] = useState(0)
  const [debugMode, setDebugMode] = useState(false)
  const [markdownErrors, setMarkdownErrors] = useState<Record<string, boolean>>({})
  const [actualIsScaleUpMember, setActualIsScaleUpMember] = useState<boolean | null>(null)
  const supabase = createClientComponentClient()

  // Verificar el valor real de isScaleUpMember
  useEffect(() => {
    const checkScaleUpStatus = async () => {
      try {
        if (!currentUserId) return

        // Verificar directamente usando la función isScaleUpMember
        const scaleUpStatus = await isScaleUpMember(currentUserId)
        setActualIsScaleUpMember(scaleUpStatus)

        // Comparar con el prop recibido
        if (scaleUpStatus !== isScaleUpMember) {
          console.warn(
            `⚠️ ADVERTENCIA: Discrepancia en isScaleUpMember - Prop recibido: ${isScaleUpMember}, Valor real: ${scaleUpStatus}`,
          )
        }
      } catch (error) {
        console.error("Error al verificar estado ScaleUp:", error)
      }
    }

    checkScaleUpStatus()
  }, [currentUserId, isScaleUpMember])

  const loadNotes = async () => {
    setIsLoading(true)
    try {
      addDebugLog(`=== CARGANDO NOTAS (${refreshKey}) ===`, "info")
      addDebugLog(`Cargando notas para oportunidad: ${opportunityId}`, "info")
      addDebugLog(`Usuario actual ID: ${currentUserId}`, "info")
      addDebugLog(`isScaleUpMember (prop): ${isScaleUpMember}`, "info")
      addDebugLog(`isScaleUpMember (real): ${actualIsScaleUpMember}`, "info")

      // IMPORTANTE: Usar el valor real de isScaleUpMember si está disponible
      const useScaleUpValue = actualIsScaleUpMember !== null ? actualIsScaleUpMember : isScaleUpMember

      // Obtener notas directamente de Supabase para depuración
      let query = supabase
        .from("notes")
        .select(`
          *,
          user:users(id, first_name, last_name, email, role_id, partner_id, tech_company_id)
        `)
        .eq("opportunity_id", opportunityId)

      // Aplicar filtro solo si no es ScaleUp
      if (!useScaleUpValue) {
        addDebugLog(`APLICANDO FILTRO MANUAL: Solo notas públicas (is_private = false)`, "info")
        query = query.eq("is_private", false)
      } else {
        addDebugLog(`NO APLICANDO FILTRO MANUAL: Usuario es ScaleUp, mostrando todas las notas`, "info")
      }

      // Ejecutar consulta
      const { data: manualNotes, error: manualError } = await query.order("created_at", { ascending: false })

      if (manualError) {
        addDebugLog(`Error en consulta manual: ${manualError.message}`, "error")
      } else {
        addDebugLog(`Notas obtenidas manualmente: ${manualNotes?.length || 0}`, "success")
      }

      // Obtener notas a través del servicio normal
      const fetchedNotes = await getNotesByOpportunityId(opportunityId, currentUserId)

      // Añadir logs detallados para depuración
      console.log("TODAS LAS NOTAS RECIBIDAS:", fetchedNotes)
      addDebugLog(`Notas recibidas del servicio: ${fetchedNotes.length}`, "info")
      fetchedNotes.forEach((note, index) => {
        addDebugLog(`Nota ${index + 1}: ID=${note.id}, Privada=${note.is_private}, Usuario=${note.user_id}`, "info")
        console.log(`Contenido de nota ${index + 1}:`, note.content)
      })

      // IMPORTANTE: Usar las notas obtenidas manualmente para garantizar que se muestren todas
      setNotes(manualNotes || [])
      addDebugLog(`Notas cargadas y establecidas en el estado: ${manualNotes?.length || 0}`, "success")
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
  }, [opportunityId, currentUserId, refreshKey, actualIsScaleUpMember])

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
    return note.user_id === currentUserId || (actualIsScaleUpMember !== null ? actualIsScaleUpMember : isScaleUpMember)
  }

  // Función para manejar errores de ReactMarkdown
  const handleMarkdownError = (noteId: string) => {
    console.error(`Error al renderizar markdown para nota ${noteId}`)
    setMarkdownErrors((prev) => ({ ...prev, [noteId]: true }))
  }

  // Función para renderizar el contenido de una nota de forma segura
  const renderNoteContent = (note: Note) => {
    try {
      // Si ya sabemos que hay un error con esta nota, usar el fallback
      if (markdownErrors[note.id]) {
        return <div className="whitespace-pre-wrap">{note.content}</div>
      }

      // Intentar renderizar con ReactMarkdown
      return (
        <div className="markdown-wrapper">
          <ReactMarkdown>{note.content}</ReactMarkdown>
        </div>
      )
    } catch (error) {
      console.error(`Error al renderizar nota ${note.id}:`, error)
      handleMarkdownError(note.id)
      return <div className="whitespace-pre-wrap">{note.content}</div>
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Reseña histórica</CardTitle>
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
        {debugMode && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-md">
            <h3 className="font-bold mb-2">Información de Props:</h3>
            <p className="text-sm">opportunityId: {opportunityId}</p>
            <p className="text-sm">currentUserId: {currentUserId}</p>
            <p className="text-sm">isScaleUpMember (prop): {isScaleUpMember ? "SÍ" : "NO"}</p>
            <p className="text-sm">
              isScaleUpMember (real):{" "}
              {actualIsScaleUpMember === null ? "Verificando..." : actualIsScaleUpMember ? "SÍ" : "NO"}
            </p>
            {isScaleUpMember !== actualIsScaleUpMember && actualIsScaleUpMember !== null && (
              <p className="text-sm font-bold text-red-500">⚠️ DISCREPANCIA DETECTADA EN isScaleUpMember</p>
            )}
          </div>
        )}

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
              {notes.map((note, index) => {
                // Añadir logs para depuración de cada nota durante el renderizado
                console.log(`Renderizando nota ${index + 1}:`, note)

                return (
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
                    <div className="mt-2">
                      {/* Usar el método seguro para renderizar el contenido */}
                      {renderNoteContent(note)}

                      {/* Mostrar un botón para alternar entre ReactMarkdown y texto plano */}
                      {markdownErrors[note.id] && (
                        <div className="mt-2 flex items-center text-xs text-amber-600">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Se detectaron problemas al renderizar esta nota con Markdown
                        </div>
                      )}
                    </div>
                    {debugMode && (
                      <div className="mt-2 text-xs text-gray-500">
                        ID: {note.id} | Privada: {note.is_private ? "Sí" : "No"}
                      </div>
                    )}
                  </div>
                )
              })}
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
        isScaleUpMember={actualIsScaleUpMember !== null ? actualIsScaleUpMember : isScaleUpMember}
        onNoteAdded={loadNotes}
      />
    </Card>
  )
}
