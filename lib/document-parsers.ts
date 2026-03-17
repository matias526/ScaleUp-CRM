import pdf from "pdf-parse"
import mammoth from "mammoth"
import * as XLSX from "xlsx"

/**
 * Extrae texto de un archivo PDF
 */
export async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer)
    return data.text
  } catch (error) {
    console.error("[v0] Error parseando PDF:", error)
    throw new Error("Error al procesar el archivo PDF")
  }
}

/**
 * Extrae texto de un archivo DOC/DOCX
 */
export async function parseDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  } catch (error) {
    console.error("[v0] Error parseando DOCX:", error)
    throw new Error("Error al procesar el archivo Word")
  }
}

/**
 * Extrae texto de un archivo XLS/XLSX
 * Convierte cada hoja en texto estructurado
 */
export async function parseXLSX(buffer: Buffer): Promise<string> {
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" })
    let text = ""

    // Procesar cada hoja
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName]

      // Agregar nombre de la hoja
      text += `\n\n=== ${sheetName} ===\n\n`

      // Convertir a CSV para mejor estructura
      const csv = XLSX.utils.sheet_to_csv(sheet)
      text += csv
    }

    return text
  } catch (error) {
    console.error("[v0] Error parseando XLSX:", error)
    throw new Error("Error al procesar el archivo Excel")
  }
}

/**
 * Extrae texto de un archivo TXT
 */
export function parseTXT(buffer: Buffer): string {
  try {
    return buffer.toString("utf-8")
  } catch (error) {
    console.error("[v0] Error parseando TXT:", error)
    throw new Error("Error al procesar el archivo de texto")
  }
}

/**
 * Detecta el tipo de archivo y usa el parser apropiado
 */
export async function parseDocument(buffer: Buffer, filename: string): Promise<string> {
  const extension = filename.toLowerCase().split(".").pop()

  switch (extension) {
    case "pdf":
      return await parsePDF(buffer)
    case "doc":
    case "docx":
      return await parseDOCX(buffer)
    case "xls":
    case "xlsx":
      return await parseXLSX(buffer)
    case "txt":
    case "md":
      return parseTXT(buffer)
    default:
      throw new Error(`Tipo de archivo no soportado: ${extension}`)
  }
}
