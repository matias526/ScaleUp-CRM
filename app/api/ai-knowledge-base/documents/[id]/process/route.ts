import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { head } from "@vercel/blob"
import { Buffer } from "buffer"
import { generateEmbedding } from "@/lib/embeddings"

export const runtime = "nodejs"
export const maxDuration = 60

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // Reuse the same logic as POST
  return POST(request, { params })
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    console.log("[v0] Starting document processing for ID:", id)

    const supabase = await createServerClient()

    // Step 1: Get document from database
    console.log("[v0] Step 1: Fetching document from database")
    const { data: document, error: docError } = await supabase.from("kb_documents").select("*").eq("id", id).single()

    if (docError || !document) {
      console.error("[v0] Document not found:", docError)
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    console.log("[v0] Document found:", {
      id: document.id,
      fileName: document.file_name,
      fileSize: document.file_size,
      status: document.status,
    })

    // Step 2: Update status to processing
    console.log("[v0] Step 2: Updating status to 'processing'")
    const { error: updateError } = await supabase
      .from("kb_documents")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", id)

    if (updateError) {
      console.error("[v0] Error updating status:", updateError)
      return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
    }

    // Step 3: Verify file exists in Blob
    console.log("[v0] Step 3: Verifying file in Blob:", document.file_path)
    const blobInfo = await head(document.file_path)
    console.log("[v0] Blob info:", {
      size: blobInfo.size,
      uploadedAt: blobInfo.uploadedAt,
    })

    // Step 4: Download file from Blob
    console.log("[v0] Step 4: Downloading file from Blob")
    const response = await fetch(document.file_path)
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log("[v0] File downloaded, size:", buffer.length, "bytes")

    // Step 5: Extract text from file
    console.log("[v0] Step 5: Extracting text from file")
    let extractedText = ""

    let fileType = document.file_type?.toLowerCase()

    // Si no hay file_type, intentar desde el nombre del archivo
    if (!fileType && document.file_name) {
      const extension = document.file_name.split(".").pop()?.toLowerCase()
      fileType = extension
      console.log("[v0] File type detected from filename:", fileType)
    }

    // Si aún no hay tipo, intentar desde la URL
    if (!fileType && document.file_path) {
      const urlParts = document.file_path.split(".")
      const extension = urlParts[urlParts.length - 1]?.split("?")[0]?.toLowerCase()
      fileType = extension
      console.log("[v0] File type detected from URL:", fileType)
    }

    console.log("[v0] Final file type:", fileType)

    if (!fileType) {
      throw new Error("Could not determine file type")
    }

    if (fileType === "txt") {
      extractedText = buffer.toString("utf-8")
      console.log("[v0] Text file extracted, length:", extractedText.length)
    } else if (fileType === "pdf") {
      console.log("[v0] Processing PDF file with unpdf")
      try {
        const { extractText, getDocumentProxy } = await import("unpdf")
        const uint8Array = new Uint8Array(buffer)

        // Primero cargar el PDF con getDocumentProxy
        const pdf = await getDocumentProxy(uint8Array)

        // Luego extraer el texto con mergePages: true
        const { text, totalPages } = await extractText(pdf, { mergePages: true })
        extractedText = text
        console.log("[v0] PDF extracted successfully, pages:", totalPages, "text length:", extractedText.length)
        console.log("[v0] First 200 chars:", extractedText.substring(0, 200))
      } catch (pdfError: any) {
        console.error("[v0] PDF parsing error:", pdfError)
        throw new Error(`Failed to extract text from PDF: ${pdfError.message}`)
      }
    } else if (fileType === "docx") {
      console.log("[v0] Processing Word file with mammoth")
      try {
        const mammoth = await import("mammoth")
        const result = await mammoth.extractRawText({ buffer })
        extractedText = result.value
        console.log("[v0] Word file extracted successfully, length:", extractedText.length)
      } catch (wordError: any) {
        console.error("[v0] Word parsing error:", wordError)
        throw new Error(`Failed to extract text from Word file: ${wordError.message}`)
      }
    } else if (fileType === "xlsx" || fileType === "xls") {
      console.log("[v0] Processing Excel file with xlsx")
      try {
        const XLSX = await import("xlsx")
        const workbook = XLSX.read(buffer, { type: "buffer" })

        // Extraer texto de todas las hojas
        const allText: string[] = []

        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName]
          allText.push(`\n=== Hoja: ${sheetName} ===\n`)

          // Convertir la hoja a JSON para extraer los datos
          const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 })

          // Convertir cada fila a texto
          jsonData.forEach((row: any) => {
            if (Array.isArray(row) && row.length > 0) {
              const rowText = row.filter((cell: any) => cell !== null && cell !== undefined).join(" | ")
              if (rowText.trim()) {
                allText.push(rowText)
              }
            }
          })
        })

        extractedText = allText.join("\n")
        console.log(
          "[v0] Excel file extracted successfully, sheets:",
          workbook.SheetNames.length,
          "length:",
          extractedText.length,
        )
      } catch (excelError: any) {
        console.error("[v0] Excel parsing error:", excelError)
        throw new Error(`Failed to extract text from Excel file: ${excelError.message}`)
      }
    } else {
      throw new Error(`Unsupported file type: ${fileType}. Please upload only .txt, .pdf, .docx, or .xlsx files.`)
    }

    if (!extractedText || extractedText.length < 10) {
      throw new Error("No text could be extracted from the file or file is too short")
    }

    console.log("[v0] Text extracted successfully, length:", extractedText.length, "characters")

    const MAX_TEXT_LENGTH = 50000 // ~50 chunks máximo
    let textToProcess = extractedText
    let wasTruncated = false

    if (extractedText.length > MAX_TEXT_LENGTH) {
      textToProcess = extractedText.slice(0, MAX_TEXT_LENGTH)
      wasTruncated = true
      console.log("[v0] Text truncated from", extractedText.length, "to", MAX_TEXT_LENGTH, "characters")
    }

    // Step 6: Split text into chunks
    console.log("[v0] Step 6: Splitting text into chunks")
    const chunkSize = 1000
    const chunks: string[] = []

    for (let i = 0; i < textToProcess.length; i += chunkSize) {
      chunks.push(textToProcess.slice(i, i + chunkSize))
    }

    console.log("[v0] Text split into", chunks.length, "chunks")

    // Step 7: Process each chunk - generate embeddings with Voyage AI and save
    console.log("[v0] Step 7: Processing chunks and generating embeddings with Jina AI")

    const BATCH_SIZE = 10 // Procesamos 10 chunks en paralelo con Jina AI

    for (let batchStart = 0; batchStart < chunks.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, chunks.length)
      const batch = chunks.slice(batchStart, batchEnd)

      console.log(
        `[v0] Processing batch ${Math.floor(batchStart / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)} (chunks ${batchStart + 1}-${batchEnd})`,
      )

      // Procesar todos los chunks del lote en paralelo
      const batchPromises = batch.map(async (chunkText, batchIndex) => {
        const chunkIndex = batchStart + batchIndex

        const embedding = await generateEmbedding(chunkText)

        // Save chunk to database
        const { error: chunkError } = await supabase.from("kb_document_chunks").insert({
          document_id: document.id,
          chunk_text: chunkText,
          chunk_index: chunkIndex,
          embedding: embedding,
          token_count: Math.ceil(chunkText.length / 4),
        })

        if (chunkError) {
          console.error(`[v0] Error saving chunk ${chunkIndex + 1}:`, chunkError)
          throw new Error(`Failed to save chunk ${chunkIndex + 1}: ${chunkError.message}`)
        }

        return chunkIndex + 1
      })

      // Esperar a que todos los chunks del lote se procesen
      await Promise.all(batchPromises)
      console.log(`[v0] Batch completed: chunks ${batchStart + 1}-${batchEnd} saved successfully`)
    }

    // Step 8: Update document status to completed
    console.log("[v0] Step 8: Updating status to 'completed'")
    const { error: completeError } = await supabase
      .from("kb_documents")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (completeError) {
      console.error("[v0] Error updating to completed:", completeError)
      throw new Error("Failed to update status to completed")
    }

    console.log("[v0] Document processing completed successfully!")

    return NextResponse.json({
      success: true,
      documentId: id,
      chunksProcessed: chunks.length,
      wasTruncated,
      message: wasTruncated
        ? `Document processed successfully (truncated to first ${MAX_TEXT_LENGTH} characters due to size)`
        : "Document processed successfully with Jina AI embeddings",
    })
  } catch (error: any) {
    console.error("[v0] Error processing document:", error)

    // Update status to failed
    try {
      const { id } = params
      const supabase = await createServerClient()
      await supabase
        .from("kb_documents")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
    } catch (updateError) {
      console.error("[v0] Error updating status to failed:", updateError)
    }

    return NextResponse.json(
      {
        error: error.message || "Failed to process document",
        details: error.toString(),
      },
      { status: 500 },
    )
  }
}
