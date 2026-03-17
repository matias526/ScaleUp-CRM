import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { taskId, status } = await request.json()

    if (!taskId || !status) {
      return NextResponse.json({ error: "Task ID and status are required" }, { status: 400 })
    }

    console.log(`[API] Actualizando tarea ${taskId} a estado: ${status}`)

    const supabase = createRouteHandlerClient({ cookies })

    // Primero verificamos que la tarea existe
    const { data: existingTask, error: fetchError } = await supabase
      .from("tasks")
      .select("id, status, title")
      .eq("id", taskId)
      .single()

    if (fetchError) {
      console.error("[API] Error al buscar la tarea:", fetchError)
      return NextResponse.json({ error: "Task not found", details: fetchError }, { status: 404 })
    }

    console.log("[API] Tarea encontrada:", existingTask)

    // Hacemos el update
    const { data: updateResult, error: updateError } = await supabase
      .from("tasks")
      .update({ status })
      .eq("id", taskId)
      .select("id, status, title, updated_at")

    if (updateError) {
      console.error("[API] Error al actualizar la tarea:", updateError)
      return NextResponse.json({ error: "Failed to update task", details: updateError }, { status: 500 })
    }

    console.log("[API] Tarea actualizada:", updateResult)

    // Verificamos que el cambio se aplicó
    const { data: verificationTask, error: verificationError } = await supabase
      .from("tasks")
      .select("id, status, title")
      .eq("id", taskId)
      .single()

    if (verificationError) {
      console.error("[API] Error al verificar la tarea:", verificationError)
    } else {
      console.log("[API] Verificación post-update:", verificationTask)
      console.log(`[API] ¿Cambio aplicado? ${verificationTask.status === status ? "SÍ" : "NO"}`)
    }

    return NextResponse.json({
      success: true,
      task: updateResult[0],
      verification: verificationTask,
    })
  } catch (error) {
    console.error("[API] Error general:", error)
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 })
  }
}
