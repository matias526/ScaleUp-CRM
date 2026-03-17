import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { head } from "@vercel/blob"

export const maxDuration = 60

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("[v0] Iniciando diagnóstico")
    const { id } = params
    console.log("[v0] Document ID:", id)

    const supabase = await createServerClient()

    const diagnostics = {
      documentId: id,
      steps: [] as Array<{ step: string; status: "success" | "error"; message: string; data?: any }>,
    }

    // PASO 1: Verificar que el documento existe en la base de datos
    console.log("[v0] PASO 1: Verificando documento en base de datos")
    const { data: document, error: dbError } = await supabase.from("kb_documents").select("*").eq("id", id).single()

    if (dbError || !document) {
      console.log("[v0] Error en PASO 1:", dbError)
      diagnostics.steps.push({
        step: "1. Verificar documento en base de datos",
        status: "error",
        message: dbError?.message || "Documento no encontrado",
      })
      return NextResponse.json(diagnostics, { status: 404 })
    }

    console.log("[v0] PASO 1: Documento encontrado")
    diagnostics.steps.push({
      step: "1. Verificar documento en base de datos",
      status: "success",
      message: "Documento encontrado",
      data: {
        fileName: document.file_name,
        fileSize: document.file_size,
        fileType: document.file_type,
        status: document.status,
        filePath: document.file_path,
      },
    })

    // PASO 2: Verificar que el archivo existe en Blob
    console.log("[v0] PASO 2: Verificando archivo en Blob")
    try {
      const blobInfo = await head(document.file_path)
      console.log("[v0] PASO 2: Archivo encontrado en Blob")
      diagnostics.steps.push({
        step: "2. Verificar archivo en Blob",
        status: "success",
        message: "Archivo encontrado en Blob",
        data: {
          size: blobInfo.size,
          uploadedAt: blobInfo.uploadedAt,
          url: blobInfo.url,
        },
      })
    } catch (blobError: any) {
      console.log("[v0] Error en PASO 2:", blobError)
      diagnostics.steps.push({
        step: "2. Verificar archivo en Blob",
        status: "error",
        message: `Error al verificar archivo en Blob: ${blobError.message}`,
      })
      return NextResponse.json(diagnostics, { status: 500 })
    }

    // PASO 3: Descargar el archivo
    console.log("[v0] PASO 3: Descargando archivo")
    try {
      const response = await fetch(document.file_path)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const arrayBuffer = await response.arrayBuffer()
      const fileBuffer = Buffer.from(arrayBuffer)

      console.log("[v0] PASO 3: Archivo descargado, tamaño:", fileBuffer.length)
      diagnostics.steps.push({
        step: "3. Descargar archivo",
        status: "success",
        message: "Archivo descargado correctamente",
        data: {
          downloadedSize: fileBuffer.length,
          isPDF: document.file_name?.toLowerCase().endsWith(".pdf"),
        },
      })
    } catch (downloadError: any) {
      console.log("[v0] Error en PASO 3:", downloadError)
      diagnostics.steps.push({
        step: "3. Descargar archivo",
        status: "error",
        message: `Error al descargar archivo: ${downloadError.message}`,
      })
      return NextResponse.json(diagnostics, { status: 500 })
    }

    // PASO 4: Verificar que tenemos la API key de OpenAI
    console.log("[v0] PASO 4: Verificando API key de OpenAI")
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY
    diagnostics.steps.push({
      step: "4. Verificar API key de OpenAI",
      status: hasOpenAIKey ? "success" : "error",
      message: hasOpenAIKey
        ? "API key de OpenAI configurada"
        : "API key de OpenAI NO configurada - necesaria para generar embeddings",
    })

    // Resumen final
    const allSuccess = diagnostics.steps.every((step) => step.status === "success")
    console.log("[v0] Diagnóstico completado. Todo OK:", allSuccess)

    return NextResponse.json({
      ...diagnostics,
      summary: {
        readyToProcess: allSuccess,
        message: allSuccess
          ? "✅ El documento está listo para ser procesado. La extracción de texto se hará durante el procesamiento."
          : "❌ Hay problemas que deben resolverse antes de procesar",
      },
    })
  } catch (error: any) {
    console.error("[v0] Error general en diagnóstico:", error)
    return NextResponse.json({ error: "Error al realizar diagnóstico", details: error.message }, { status: 500 })
  }
}
