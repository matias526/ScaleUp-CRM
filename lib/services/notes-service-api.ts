// Función para crear una nota a través de la API
export async function createNote(noteData: {
  opportunity_id: string
  content: string
  is_private?: boolean
}) {
  try {
    const response = await fetch("/api/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(noteData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Error al crear la nota")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en createNoteApi:", error)
    return null
  }
}

// Función para actualizar una nota a través de la API
export async function updateNote(
  noteId: string,
  noteData: {
    content: string
    is_private?: boolean
  },
) {
  try {
    const response = await fetch(`/api/notes/${noteId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(noteData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Error al actualizar la nota")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en updateNoteApi:", error)
    return null
  }
}

// Función para eliminar una nota a través de la API
export async function deleteNote(noteId: string) {
  try {
    const response = await fetch(`/api/notes/${noteId}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Error al eliminar la nota")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en deleteNoteApi:", error)
    return null
  }
}
