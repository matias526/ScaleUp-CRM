"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-provider"

export default function NotesQueryDebug({ opportunityId }: { opportunityId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [allNotes, setAllNotes] = useState<any[]>([])
  const [publicNotes, setPublicNotes] = useState<any[]>([])
  const [filteredNotes, setFilteredNotes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [domNotes, setDomNotes] = useState<Element[]>([])
  const { user } = useAuth()

  useEffect(() => {
    if (!isOpen || !opportunityId) return

    const fetchDebugData = async () => {
      setIsLoading(true)
      try {
        // 1. Obtener información del usuario - CORREGIDO: Consulta mejorada
        if (user?.id) {
          // Consulta directa a la tabla de usuarios
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("id, first_name, last_name, email, role_id, partner_id, tech_company_id")
            .eq("id", user.id)
            .single()

          if (userError) {
            console.error("Error al obtener datos del usuario:", userError)
          } else {
            // Consulta separada para obtener información del rol
            if (userData.role_id) {
              const { data: roleData, error: roleError } = await supabase
                .from("roles")
                .select("id, name, code")
                .eq("id", userData.role_id)
                .single()

              if (!roleError && roleData) {
                // Combinar datos de usuario y rol
                setUserInfo({
                  ...userData,
                  role: roleData,
                })
              } else {
                console.error("Error al obtener datos del rol:", roleError)
                setUserInfo(userData)
              }
            } else {
              setUserInfo(userData)
            }
          }
        }

        // 2. Obtener TODAS las notas sin filtro
        const { data: allNotesData, error: allNotesError } = await supabase
          .from("notes")
          .select(`
            *,
            user:users(id, first_name, last_name, email, role_id, partner_id, tech_company_id)
          `)
          .eq("opportunity_id", opportunityId)
          .order("created_at", { ascending: false })

        if (allNotesError) {
          console.error("Error al obtener todas las notas:", allNotesError)
        } else {
          setAllNotes(allNotesData || [])
          console.log("TODAS LAS NOTAS:", allNotesData)
        }

        // 3. Obtener solo notas públicas
        const { data: publicNotesData, error: publicNotesError } = await supabase
          .from("notes")
          .select(`
            *,
            user:users(id, first_name, last_name, email, role_id, partner_id, tech_company_id)
          `)
          .eq("opportunity_id", opportunityId)
          .eq("is_private", false)
          .order("created_at", { ascending: false })

        if (publicNotesError) {
          console.error("Error al obtener notas públicas:", publicNotesError)
        } else {
          setPublicNotes(publicNotesData || [])
        }

        // 4. Obtener notas con el filtro que se está usando actualmente
        // Determinar si el usuario es miembro de ScaleUp
        let isScaleUp = false
        if (user?.id) {
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("role_id, partner_id")
            .eq("id", user.id)
            .single()

          if (!userError && userData) {
            const scaleUpRoles = [1, 2, 3] // IDs de roles que pertenecen a ScaleUp
            isScaleUp = scaleUpRoles.includes(userData.role_id) || userData.partner_id === null
          }
        }

        // Construir la consulta base
        let query = supabase
          .from("notes")
          .select(`
            *,
            user:users(id, first_name, last_name, email, role_id, partner_id, tech_company_id)
          `)
          .eq("opportunity_id", opportunityId)

        // Si el usuario no es de ScaleUp, filtrar las notas privadas
        if (!isScaleUp) {
          query = query.eq("is_private", false)
        }

        // Ejecutar la consulta
        const { data: filteredNotesData, error: filteredNotesError } = await query.order("created_at", {
          ascending: false,
        })

        if (filteredNotesError) {
          console.error("Error al obtener notas filtradas:", filteredNotesError)
        } else {
          setFilteredNotes(filteredNotesData || [])
        }

        // 5. Obtener las notas renderizadas en el DOM
        const notesElements = document.querySelectorAll(".border.rounded-lg.p-4")
        setDomNotes(Array.from(notesElements))
      } catch (error) {
        console.error("Error en la depuración:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDebugData()
  }, [isOpen, opportunityId, user])

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} className="mt-4">
        Depurar Notas
      </Button>
    )
  }

  // Determinar si el usuario es ScaleUp basado en los datos obtenidos
  // CORREGIDO: Usar la información del rol correctamente
  const roleId = userInfo?.role_id
  const roleCode = userInfo?.role?.code || ""
  const roleName = userInfo?.role?.name || ""
  const hasNoPartner = !userInfo?.partner_id
  const isAdmin = roleCode === "Admin" || roleId === 1
  const isBDD = roleCode === "BDD" || roleId === 2
  const isUserScaleUp = isAdmin || isBDD || hasNoPartner

  // Contar notas privadas
  const privateNotesCount = allNotes.filter((note) => note.is_private).length
  const publicNotesCount = allNotes.filter((note) => !note.is_private).length

  return (
    <Card className="mt-4 border-2 border-yellow-400">
      <CardHeader className="bg-yellow-50">
        <CardTitle className="flex justify-between">
          <span>Depuración de Notas</span>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            Cerrar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {isLoading ? (
          <div>Cargando información de depuración...</div>
        ) : (
          <>
            <div className="space-y-2">
              <h3 className="font-bold">Información del Usuario:</h3>
              <div className="bg-gray-100 p-2 rounded text-sm">
                <p>
                  <strong>ID:</strong> {user?.id}
                </p>
                <p>
                  <strong>Email:</strong> {user?.email}
                </p>
                <p>
                  <strong>Role ID:</strong> {roleId || "No definido"}
                </p>
                <p>
                  <strong>Role Name:</strong> {roleName || "No definido"}
                </p>
                <p>
                  <strong>Role Code:</strong> {roleCode || "No definido"}
                </p>
                <p>
                  <strong>Partner ID:</strong> {userInfo?.partner_id || "null"}
                </p>
                <p>
                  <strong>¿Es ScaleUp?:</strong> {isUserScaleUp ? "SÍ" : "NO"} (Admin: {isAdmin ? "SÍ" : "NO"}, BDD:{" "}
                  {isBDD ? "SÍ" : "NO"}, Sin Partner: {hasNoPartner ? "SÍ" : "NO"})
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold">Consulta SQL que se está ejecutando:</h3>
              <div className="bg-gray-100 p-2 rounded text-sm font-mono whitespace-pre-wrap">
                {`
SELECT *
FROM notes
WHERE opportunity_id = '${opportunityId}'
${!isUserScaleUp ? "AND is_private = false" : "/* Sin filtro de privacidad para usuarios ScaleUp */"}
ORDER BY created_at DESC
                `}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold">Resumen de Notas:</h3>
              <div className="bg-gray-100 p-2 rounded text-sm">
                <p>
                  <strong>Total de notas en la base de datos:</strong> {allNotes.length}
                </p>
                <p>
                  <strong>Notas privadas:</strong> {privateNotesCount}
                </p>
                <p>
                  <strong>Notas públicas:</strong> {publicNotesCount}
                </p>
                <p>
                  <strong>Notas que debería ver este usuario:</strong>{" "}
                  {isUserScaleUp ? allNotes.length : publicNotesCount}
                </p>
                <p>
                  <strong>Notas que está viendo realmente:</strong> {filteredNotes.length}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold">Detalle de Notas Privadas:</h3>
              <div className="bg-gray-100 p-2 rounded text-sm">
                {allNotes.filter((note) => note.is_private).length > 0 ? (
                  <ul className="list-disc pl-5">
                    {allNotes
                      .filter((note) => note.is_private)
                      .map((note, index) => (
                        <li key={note.id}>
                          <strong>Nota {index + 1}:</strong> ID={note.id}, Creada=
                          {new Date(note.created_at).toLocaleString()}, Usuario={note.user?.first_name}{" "}
                          {note.user?.last_name}
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p>No hay notas privadas para esta oportunidad.</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-md font-semibold">Notas en el DOM (renderizadas):</h3>
              <p className="text-sm text-gray-600">
                Esta sección muestra las notas que realmente se están renderizando en la página.
              </p>
              <div className="mt-2">
                {domNotes.length > 0 ? (
                  <>
                    <p className="text-sm">
                      Número de notas renderizadas: <span className="font-semibold">{domNotes.length}</span>
                    </p>
                    <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                      <p>IDs de las notas renderizadas (si están disponibles):</p>
                      <ul className="list-disc pl-5 mt-1">
                        {Array.from(domNotes).map((el, i) => (
                          <li key={i}>
                            Nota DOM {i + 1}: {el.getAttribute("data-note-id") || "ID no disponible"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-amber-600">No se pueden contar las notas renderizadas</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold">Notas que está viendo actualmente:</h3>
              <div className="bg-gray-100 p-2 rounded text-sm">
                {filteredNotes.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {filteredNotes.map((note, index) => (
                      <li key={note.id}>
                        <strong>Nota {index + 1}:</strong> ID={note.id}, Privada={note.is_private ? "SÍ" : "NO"},
                        Creada={new Date(note.created_at).toLocaleString()}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No se están mostrando notas.</p>
                )}
              </div>
            </div>

            <div className="mt-4 p-3 bg-red-50 border border-red-300 rounded-md">
              <h3 className="font-bold text-red-700">Análisis de Discrepancia:</h3>
              <p className="text-sm mt-1">
                {filteredNotes.length !== domNotes.length
                  ? `¡ALERTA! Hay una discrepancia entre las notas obtenidas (${filteredNotes.length}) y las renderizadas (${domNotes.length}).`
                  : "No hay discrepancia entre las notas obtenidas y las renderizadas."}
              </p>
              {filteredNotes.length !== domNotes.length && (
                <div className="mt-2 text-xs">
                  <p className="font-semibold">Posibles causas:</p>
                  <ul className="list-disc pl-5 mt-1">
                    <li>Problema en el renderizado de alguna nota específica</li>
                    <li>Error en el contenido de alguna nota que impide su renderizado</li>
                    <li>Filtrado adicional en el componente que no está siendo detectado</li>
                  </ul>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
