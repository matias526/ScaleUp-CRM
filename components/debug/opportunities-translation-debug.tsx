"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "@/hooks/use-translations"
import { TranslationService } from "@/lib/services/translation-service"

export function OpportunitiesTranslationDebug() {
  const { t, language, isLoaded, reloadTranslations } = useTranslations()
  const [showDetails, setShowDetails] = useState(false)
  const [serviceState, setServiceState] = useState<any>(null)

  // Claves específicas que queremos verificar
  const keysToCheck = [
    "opportunities.title",
    "opportunities.create",
    "opportunities.table_view",
    "opportunities.kanban_view",
    "opportunity.name",
    "opportunity.stage",
    "opportunity.value",
    "opportunity.probability",
    "opportunity.expected_close_date",
    "opportunity.actions",
  ]

  useEffect(() => {
    // Obtener el estado del servicio de traducciones
    if (isLoaded) {
      const state = {
        isInitialized: TranslationService.isInitialized,
        languages: TranslationService.getAvailableLanguages(),
        lastError: TranslationService.getLastError()?.message || null,
        initStats: TranslationService.getInitStats(),
      }
      setServiceState(state)
    }
  }, [isLoaded])

  // Función para verificar si una clave existe en la base de datos
  const checkTranslationExists = async (key: string) => {
    try {
      const query = `SELECT * FROM translations WHERE key = '${key}' AND language = '${language}'`
      const result = await TranslationService.queryTranslations(query)
      return result.data && result.data.length > 0 ? result.data[0].value : null
    } catch (error) {
      console.error(`Error al verificar traducción para ${key}:`, error)
      return null
    }
  }

  // Función para forzar la recarga de traducciones
  const handleReload = async () => {
    await reloadTranslations()
    // Actualizar el estado después de recargar
    const state = {
      isInitialized: TranslationService.isInitialized,
      languages: TranslationService.getAvailableLanguages(),
      lastError: TranslationService.getLastError()?.message || null,
      initStats: TranslationService.getInitStats(),
    }
    setServiceState(state)
  }

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md mb-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-yellow-800">Depuración de Traducciones de Oportunidades</h3>
        <div className="space-x-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 rounded text-sm"
          >
            {showDetails ? "Ocultar detalles" : "Mostrar detalles"}
          </button>
          <button onClick={handleReload} className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded text-sm">
            Recargar traducciones
          </button>
        </div>
      </div>

      <div className="mt-2">
        <p>
          <strong>Estado:</strong> {isLoaded ? "Traducciones cargadas" : "Cargando traducciones..."}
        </p>
        <p>
          <strong>Idioma actual:</strong> {language}
        </p>
        {serviceState && (
          <p>
            <strong>Servicio inicializado:</strong> {serviceState.isInitialized ? "Sí" : "No"}
          </p>
        )}
      </div>

      {showDetails && serviceState && (
        <div className="mt-4">
          <h4 className="font-medium text-yellow-800">Estado del Servicio:</h4>
          <pre className="bg-white p-2 rounded text-xs mt-1 overflow-auto max-h-32">
            {JSON.stringify(serviceState, null, 2)}
          </pre>

          <h4 className="font-medium text-yellow-800 mt-4">Traducciones Verificadas:</h4>
          <div className="overflow-x-auto">
            <table className="w-full mt-2 text-sm">
              <thead className="bg-yellow-100">
                <tr>
                  <th className="px-2 py-1 text-left">Clave</th>
                  <th className="px-2 py-1 text-left">Valor Obtenido (t)</th>
                  <th className="px-2 py-1 text-left">¿Es la clave?</th>
                </tr>
              </thead>
              <tbody>
                {keysToCheck.map((key) => {
                  const value = t(key)
                  const isKey = value === key

                  return (
                    <tr key={key} className={isKey ? "bg-red-50" : "bg-green-50"}>
                      <td className="px-2 py-1 border-t">{key}</td>
                      <td className="px-2 py-1 border-t">{value}</td>
                      <td className="px-2 py-1 border-t">
                        {isKey ? (
                          <span className="text-red-600 font-medium">Sí - Problema</span>
                        ) : (
                          <span className="text-green-600">No - OK</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <h4 className="font-medium text-yellow-800">Verificación Directa en DB:</h4>
            <button
              onClick={async () => {
                const results = {}
                for (const key of keysToCheck) {
                  const dbValue = await checkTranslationExists(key)
                  results[key] = dbValue
                }
                console.log("Resultados de verificación directa:", results)
                alert("Verificación completada. Ver consola para resultados.")
              }}
              className="px-3 py-1 bg-purple-100 hover:bg-purple-200 rounded text-sm mt-1"
            >
              Verificar en DB
            </button>
            <p className="text-xs text-gray-600 mt-1">(Los resultados se mostrarán en la consola)</p>
          </div>
        </div>
      )}
    </div>
  )
}
