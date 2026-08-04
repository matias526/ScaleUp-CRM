"use client"

import { useState, useRef } from "react"
import { useTranslations } from "@/hooks/use-translations"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Loader2, Upload, X } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { DICT_LANG_UNVERIFIED_CONTACTS } from "@/lib/translations/unverified-contacts"

interface UnverifiedContactsImportProps {
  onSuccess: () => void
}

export function UnverifiedContactsImport({ onSuccess }: UnverifiedContactsImportProps) {
  const { t, language } = useTranslations()
  const dict = DICT_LANG_UNVERIFIED_CONTACTS
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateCSV = (headers: string[]): boolean => {
    const requiredFields = ["first_name", "last_name", "email", "company_name"]
    return requiredFields.every((field) => headers.includes(field))
  }

  const parseCSV = (content: string) => {
    const lines = content.trim().split("\n")
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())

    if (!validateCSV(headers)) {
      throw new Error(
        "CSV debe contener al menos: first_name, last_name, email, company_name",
      )
    }

    const records = []
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue

      const values = lines[i].split(",").map((v) => v.trim())
      const record: Record<string, string> = {}

      headers.forEach((header, index) => {
        record[header] = values[index] || ""
      })

      records.push({
        first_name: record["first_name"],
        last_name: record["last_name"],
        email: record["email"],
        phone: record["phone"] || null,
        company_name: record["company_name"],
        position: record["position"] || null,
        industry_id: record["industry_id"] || null,
        country_id: record["country_id"] || null,
        source: "BULK_IMPORT",
        status: "NEW",
      })
    }

    return records
  }

  const handleFileSelect = async (selectedFile: File) => {
    try {
      setIsLoading(true)
      setFile(selectedFile)

      const content = await selectedFile.text()
      const records = parseCSV(content)

      if (records.length === 0) {
        throw new Error("El archivo CSV no contiene registros")
      }

      // Insert into database
      const { error } = await supabase.from("unverified_contacts").insert(records)

      if (error) throw error

      toast({
        title: "CSV importado exitosamente",
        description: `Se agregaron ${records.length} contactos`,
      })

      setFile(null)
      onSuccess()
    } catch (error) {
      console.error("[v0] Error importing CSV:", error)
      toast({
        title: dict["unverified_contacts.error.importing"][language],
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
      setFile(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4 py-4">
      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          const files = e.dataTransfer.files
          if (files.length > 0) {
            const csvFile = files[0]
            if (csvFile.type === "text/csv" || csvFile.name.endsWith(".csv")) {
              handleFileSelect(csvFile)
            } else {
              toast({
                title: "Archivo inválido",
                description: "Solo se aceptan archivos CSV",
                variant: "destructive",
              })
            }
          }
        }}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
        } ${file ? "bg-green-50 border-green-500" : ""}`}
      >
        {file ? (
          <div className="space-y-2">
            <div className="text-green-600">✓ {file.name}</div>
            <p className="text-sm text-gray-600">{(file.size / 1024).toFixed(2)} KB</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFile(null)}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4 mr-2" />
              Quitar
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-8 w-8 mx-auto text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">
                {dict["unverified_contacts.import.drag_drop"][language]}
              </p>
              <p className="text-sm text-gray-600">
                {dict["unverified_contacts.import.or"][language]}{" "}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:underline"
                >
                  {dict["unverified_contacts.import.click_select"][language]}
                </button>
              </p>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={(e) => {
            if (e.target.files?.length) {
              handleFileSelect(e.target.files[0])
            }
          }}
          className="hidden"
        />
      </div>

      {/* CSV Template Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-blue-900 mb-2">Formato requerido:</p>
        <p className="text-sm text-blue-800 font-mono bg-white p-2 rounded">
          first_name, last_name, email, company_name, phone, position, country_id, industry_id
        </p>
      </div>

      {/* Import Button */}
      <Button 
        onClick={() => fileInputRef.current?.click()} 
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
        {dict["unverified_contacts.import.button"][language]}
      </Button>
    </div>
  )
}
