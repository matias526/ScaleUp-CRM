import { supabase } from "@/lib/supabase/client"

export interface Note {
  id: string
  opportunity_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string | null
  is_private: boolean
  user?: any // Información del usuario que creó la nota
}

// Función para añadir logs desde cualquier parte de la aplicación
export function addDebugLog(message: string, type: "info" | "error" | "success" = "info") {
  // Siempre mostrar en consola para depuración
  console.log(`[${type.toUpperCase()}] ${message}`)

  // Si estamos en el cliente, añadir al array de logs global
  if (typeof window !== "undefined" && window.addGlobalLog) {
    window.addGlobalLog(message, type)
  }
}

// Obtener notas por ID de oportunidad
export async function getNotesByOpportunityId(opportunityId: string, currentUserId?: string): Promise<Note[]> {
  try {
    addDebugLog(`=== INICIO CARGA DE NOTAS ===`, "info")
    addDebugLog(`Obteniendo notas para oportunidad: ${opportunityId}`, "info")
    addDebugLog(`Usuario actual ID: ${currentUserId || "no autenticado"}`, "info")

    // Primero verificamos si el usuario actual es miembro de ScaleUp
    let isUserScaleUp = false
    if (currentUserId) {
      isUserScaleUp = await isScaleUpMember(currentUserId)
      addDebugLog(`¿Usuario ${currentUserId} es miembro de ScaleUp?: ${isUserScaleUp}`, "info")
    } else {
      addDebugLog(`No hay usuario autenticado, tratando como no ScaleUp`, "info")
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
    if (!isUserScaleUp) {
      addDebugLog(`APLICANDO FILTRO: Solo notas públicas (is_private = false)`, "info")
      query = query.eq("is_private", false)
    } else {
      addDebugLog(`NO APLICANDO FILTRO: Usuario es ScaleUp, mostrando todas las notas`, "info")
    }

    // Ejecutar la consulta ordenando por fecha de creación descendente
    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      addDebugLog(`Error al obtener notas: ${error.message}`, "error")
      return []
    }

    // Mostrar información detallada de las notas obtenidas
    addDebugLog(`Notas obtenidas de la base de datos: ${data?.length || 0}`, "success")
    if (data && data.length > 0) {
      data.forEach((note, index) => {
        addDebugLog(`Nota ${index + 1}: ID=${note.id}, Privada=${note.is_private}, Usuario=${note.user_id}`, "info")
      })
    }

    // IMPORTANTE: Verificar si hay algún filtrado adicional aquí
    addDebugLog(`Notas que se devolverán al componente: ${data?.length || 0}`, "info")

    addDebugLog(`=== FIN CARGA DE NOTAS ===`, "info")
    return data || []
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    addDebugLog(`Error inesperado al obtener notas: ${errorMessage}`, "error")
    return []
  }
}

// Crear una nueva nota
export async function createNote(noteData: {
  opportunity_id: string
  user_id: string
  content: string
  is_private?: boolean
}): Promise<Note | null> {
  try {
    // Preparar los datos solo con los campos que existen en la tabla
    const noteToInsert = {
      opportunity_id: noteData.opportunity_id,
      user_id: noteData.user_id,
      content: noteData.content,
      is_private: noteData.is_private === true,
      created_at: new Date().toISOString(),
    }

    // Log detallado del objeto que se va a insertar
    addDebugLog(`Insertando nota con datos: ${JSON.stringify(noteToInsert)}`, "info")

    // Insertar en la tabla 'notes' usando la API de Supabase directamente
    const { data, error } = await supabase
      .from("notes")
      .insert([noteToInsert]) // Asegurarse de que sea un array
      .select()
      .single()

    if (error) {
      addDebugLog(`Error al crear nota: ${error.message}`, "error")
      addDebugLog(`Detalles del error: ${JSON.stringify(error)}`, "error")
      return null
    }

    addDebugLog(`Nota creada exitosamente: ${data.id}`, "success")
    return data
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    addDebugLog(`Error inesperado al crear nota: ${errorMessage}`, "error")
    return null
  }
}

// Actualizar una nota existente
export async function updateNote(
  noteId: string,
  noteData: {
    content: string
    is_private?: boolean
  },
): Promise<Note | null> {
  try {
    // Preparar los datos para actualizar
    const noteToUpdate = {
      content: noteData.content,
      updated_at: new Date().toISOString(),
      ...(noteData.is_private !== undefined && { is_private: noteData.is_private }),
    }

    // Log detallado del objeto que se va a actualizar
    addDebugLog(`Actualizando nota ${noteId} con datos: ${JSON.stringify(noteToUpdate)}`, "info")

    // Actualizar en la tabla 'notes' usando la API de Supabase directamente
    const { data, error } = await supabase.from("notes").update(noteToUpdate).eq("id", noteId).select().single()

    if (error) {
      addDebugLog(`Error al actualizar nota: ${error.message}`, "error")
      addDebugLog(`Detalles del error: ${JSON.stringify(error)}`, "error")
      return null
    }

    addDebugLog(`Nota actualizada exitosamente: ${data.id}`, "success")
    return data
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    addDebugLog(`Error inesperado al actualizar nota: ${errorMessage}`, "error")
    return null
  }
}

// Eliminar una nota
export async function deleteNote(noteId: string): Promise<boolean> {
  try {
    addDebugLog(`Eliminando nota: ${noteId}`, "info")

    const { error } = await supabase.from("notes").delete().eq("id", noteId)

    if (error) {
      addDebugLog(`Error al eliminar nota: ${error.message}`, "error")
      return false
    }

    addDebugLog(`Nota eliminada exitosamente: ${noteId}`, "success")
    return true
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    addDebugLog(`Error inesperado al eliminar nota: ${errorMessage}`, "error")
    return false
  }
}

// Crear una nota de sistema para cambios de etapa
export async function createStageChangeNote(
  opportunityId: string,
  userId: string,
  oldStageCode: string,
  newStageCode: string,
): Promise<Note | null> {
  try {
    addDebugLog(`Creando nota de cambio de etapa: ${oldStageCode} -> ${newStageCode}`, "info")
    addDebugLog(`Esta nota se guardará como PRIVADA (is_private: true)`, "info")

    const content = `**Cambio de etapa:** De *${formatStageCode(oldStageCode)}* a *${formatStageCode(newStageCode)}*`

    return await createNote({
      opportunity_id: opportunityId,
      user_id: userId,
      content,
      is_private: true, // FORZAR: Las notas de cambio de etapa SIEMPRE son privadas
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    addDebugLog(`Error al crear nota de cambio de etapa: ${errorMessage}`, "error")
    return null
  }
}

// Función auxiliar para formatear el código de etapa
function formatStageCode(code: string): string {
  if (!code) return "Sin etapa"
  return code.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
}

// Crear una nota de sistema para la creación de oportunidad
export async function createOpportunityCreationNote(opportunityId: string, userId: string): Promise<Note | null> {
  try {
    addDebugLog(`Creando nota de creación de oportunidad. ID: ${opportunityId}, Usuario: ${userId}`, "info")

    const content = "**Creación de la oportunidad**"

    return await createNote({
      opportunity_id: opportunityId,
      user_id: userId,
      content,
      is_private: false, // Las notas de sistema siempre son públicas
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    addDebugLog(`Error al crear nota de creación de oportunidad: ${errorMessage}`, "error")
    return null
  }
}

// Crear una nota de sistema para la validación de oportunidad
export async function createOpportunityValidationNote(
  opportunityId: string,
  userId: string,
  isScaleUpMember = false,
): Promise<Note | null> {
  try {
    // CORREGIDO: Ahora creamos notas para todos los usuarios, pero con contenido diferente
    addDebugLog(`Creando nota de validación de oportunidad. ID: ${opportunityId}, Usuario: ${userId}`, "info")

    // Contenido diferente según si es miembro de ScaleUp o no
    const content = isScaleUpMember ? "**Oportunidad Validada por ScaleUp**" : "**Oportunidad Validada**"

    return await createNote({
      opportunity_id: opportunityId,
      user_id: userId,
      content,
      is_private: false, // Las notas de sistema siempre son públicas
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    addDebugLog(`Error al crear nota de validación de oportunidad: ${errorMessage}`, "error")
    return null
  }
}

// Crear una nota de sistema para el rechazo de oportunidad
export async function createOpportunityRejectionNote(
  opportunityId: string,
  userId: string,
  reason = "",
): Promise<Note | null> {
  try {
    addDebugLog(
      `Creando nota de rechazo de oportunidad. ID: ${opportunityId}, Usuario: ${userId}, Motivo: ${reason}`,
      "info",
    )

    const content = reason ? `**Oportunidad Rechazada** por: *${reason}*` : "**Oportunidad Rechazada**"

    return await createNote({
      opportunity_id: opportunityId,
      user_id: userId,
      content,
      is_private: false, // Las notas de sistema siempre son públicas
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    addDebugLog(`Error al crear nota de rechazo de oportunidad: ${errorMessage}`, "error")
    return null
  }
}

// Verificar si un usuario es miembro de ScaleUp
export async function isScaleUpMember(userId: string): Promise<boolean> {
  try {
    addDebugLog(`Verificando si el usuario ${userId} es miembro de ScaleUp...`, "info")

    // CORREGIDO: Consulta mejorada para obtener información del rol
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, role_id, partner_id")
      .eq("id", userId)
      .single()

    if (userError) {
      addDebugLog(`Error al verificar si es miembro de ScaleUp: ${userError.message}`, "error")
      return false
    }

    // Mostrar datos detallados para debugging
    addDebugLog(`Datos del usuario: role_id=${userData.role_id}, partner_id=${userData.partner_id || "null"}`, "info")

    // Si el usuario tiene role_id, verificar si es un rol de ScaleUp
    let isScaleUp = false

    if (userData.role_id) {
      // Obtener información del rol
      const { data: roleData, error: roleError } = await supabase
        .from("roles")
        .select("id, code")
        .eq("id", userData.role_id)
        .single()

      if (!roleError && roleData) {
        addDebugLog(`Rol del usuario: id=${roleData.id}, code=${roleData.code}`, "info")

        // Verificar si es un rol de ScaleUp por código o ID
        const scaleUpRoleCodes = ["Admin", "BDD", "ScaleUp"]
        const scaleUpRoleIds = [1, 2, 3] // IDs de roles que pertenecen a ScaleUp

        isScaleUp =
          scaleUpRoleCodes.includes(roleData.code) ||
          scaleUpRoleIds.includes(roleData.id) ||
          userData.partner_id === null
      } else {
        // Si hay error al obtener el rol, usar solo el partner_id
        addDebugLog(`Error al obtener rol o rol no encontrado: ${roleError?.message || "Rol no encontrado"}`, "info")
        isScaleUp = userData.partner_id === null
      }
    } else {
      // Si no tiene role_id, verificar solo por partner_id
      isScaleUp = userData.partner_id === null
    }

    addDebugLog(`Resultado: Usuario ${userId} ${isScaleUp ? "ES" : "NO ES"} miembro de ScaleUp`, "info")

    return isScaleUp
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    addDebugLog(`Error inesperado al verificar si es miembro de ScaleUp: ${errorMessage}`, "error")
    return false
  }
}
