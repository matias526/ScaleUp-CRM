"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "@/hooks/use-translations"
import { CustomFieldsTable } from "./custom-fields-table"
import { getOpportunityTechFieldsClient } from "@/lib/services/opportunity-tech-field-service-client"
import { getTechCompanies } from "@/lib/services/tech-company-service"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface CustomFieldsListProps {
  initialTechCompanies: any[]
}

export function CustomFieldsList({ initialTechCompanies }: CustomFieldsListProps) {
  const { t } = useTranslations()
  const [fields, setFields] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTechCompany, setSelectedTechCompany] = useState<string>("all")
  const [techCompanies, setTechCompanies] = useState<any[]>(initialTechCompanies || [])
  const [queryLog, setQueryLog] = useState<string[]>([])

  const addLog = (message: string) => {
    setQueryLog((prev) => [...prev, `[${new Date().toISOString()}] ${message}`])
  }

  const loadFields = async () => {
    setLoading(true)
    setError(null)

    try {
      addLog("Iniciando consulta de campos personalizados...")

      const allFields = await getOpportunityTechFieldsClient()

      addLog(`Consulta completada. Resultados: ${allFields.length} campos`)

      // Filtrar por empresa tecnológica si es necesario
      const filteredFields =
        selectedTechCompany === "all"
          ? allFields
          : allFields.filter((field) => field.tech_company_id === selectedTechCompany)

      setFields(filteredFields)
    } catch (err: any) {
      const errorMessage = err.message || "Error desconocido"
      addLog(`Error: ${errorMessage}`)
      setError(`Error al cargar los campos personalizados: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const loadTechCompanies = async () => {
    try {
      // Si no hay empresas tecnológicas iniciales, cargarlas desde el cliente
      if (!initialTechCompanies || initialTechCompanies.length === 0) {
        addLog("No hay empresas tecnológicas iniciales, cargando desde el cliente...")
        const companies = await getTechCompanies()
        addLog(`Empresas tecnológicas cargadas desde el cliente: ${companies.length}`)
        setTechCompanies(companies)
      } else {
        addLog(`Usando empresas tecnológicas iniciales: ${initialTechCompanies.length}`)
      }
    } catch (err: any) {
      const errorMessage = err.message || "Error desconocido"
      addLog(`Error al cargar empresas: ${errorMessage}`)
      setError(`Error al cargar las empresas tecnológicas: ${errorMessage}`)
    }
  }

  useEffect(() => {
    loadTechCompanies()
    loadFields()
  }, [selectedTechCompany])

  return (
    <div className="space-y-4">
      {/* Información de depuración */}
      <Card className="bg-green-50 border-green-200 mb-4">
        <CardContent className="p-4">
          <h3 className="font-medium mb-2">Depuración de Campos Personalizados:</h3>
          <div className="space-y-2">
            <p>Estado: {loading ? "Cargando..." : "Completado"}</p>
            {error && <p className="text-red-500">Error: {error}</p>}
            <p>Campos cargados: {fields.length}</p>
            <p>Empresa tecnológica seleccionada: {selectedTechCompany === "all" ? "Todas" : selectedTechCompany}</p>
            <p>Empresas tecnológicas disponibles: {techCompanies.length}</p>

            <div>
              <h4 className="font-medium">Log de consultas:</h4>
              <div className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {queryLog.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="mb-6">
            <Label htmlFor="tech-company-filter">
              {t("opportunity_tech_fields.filter_by_tech_company") || "Filtrar por empresa tecnológica"}
            </Label>
            <Select value={selectedTechCompany} onValueChange={setSelectedTechCompany}>
              <SelectTrigger id="tech-company-filter" className="mt-1">
                <SelectValue
                  placeholder={t("opportunity_tech_fields.all_tech_companies") || "Todas las empresas tecnológicas"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("opportunity_tech_fields.all_tech_companies") || "Todas las empresas tecnológicas"}
                </SelectItem>
                {techCompanies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <CustomFieldsTable fields={fields} loading={loading} onRefresh={loadFields} />
        </CardContent>
      </Card>
    </div>
  )
}
