"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "@/hooks/use-translations"
import { TranslationService } from "@/lib/services/translation-service"

export function OpportunitiesTranslationDebug() {
  const { t, language, isLoaded, reloadTranslations } = useTranslations()
  const [showDetails, setShowDetails] = useState(false)
  const [serviceState, setServiceState] = useState<any>(null)
  const [directTranslations, setDirectTranslations] = useState<Record<string, string>>({})

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

      // Obtener traducciones directamente del servicio
      const translations = {}
      keysToCheck.forEach((key) => {
        translations[key] = TranslationService.getTranslation(key, language, "")
      })
      setDirectTranslations(translations)
    }
  }, [isLoaded, language])

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

    // Actualizar traducciones directas
    const translations = {}
    keysToCheck.forEach((key) => {
      translations[key] = TranslationService.getTranslation(key, language, "")
    })
    setDirectTranslations(translations)
  }

  // Función para verificar si una clave existe en las traducciones cargadas
  const checkTranslationInMemory = (key: string) => {
    try {
      // Acceder directamente a las traducciones en memoria
      const allTranslations = TranslationService.getAllTranslationsForLanguage(language)
      return allTranslations[key] || null
    } catch (error) {
      console.error(`Error al verificar traducción para ${key}:`, error)
      return null
    }
  }

  // Función para verificar todas las traducciones en memoria
  const checkAllTranslationsInMemory = () => {
    const results = {}
    keysToCheck.forEach((key) => {
      results[key] = checkTranslationInMemory(key)
    })
    console.log("Traducciones en memoria:", results)
    alert("Verificación completada. Ver consola para resultados.")
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
                  <th className="px-2 py-1 text-left">Valor desde hook (t)</th>
                  <th className="px-2 py-1 text-left">Valor directo (Service)</th>
                  <th className="px-2 py-1 text-left">¿Es la clave?</th>
                </tr>
              </thead>
              <tbody>
                {keysToCheck.map((key) => {
                  const hookValue = t(key)
                  const directValue = directTranslations[key] || ""
                  const isKey = hookValue === key

                  return (
                    <tr key={key} className={isKey ? "bg-red-50" : "bg-green-50"}>
                      <td className="px-2 py-1 border-t">{key}</td>
                      <td className="px-2 py-1 border-t">{hookValue}</td>
                      <td className="px-2 py-1 border-t">{directValue}</td>
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
            <h4 className="font-medium text-yellow-800">Verificación en Memoria:</h4>
            <button
              onClick={checkAllTranslationsInMemory}
              className="px-3 py-1 bg-purple-100 hover:bg-purple-200 rounded text-sm mt-1"
            >
              Verificar Traducciones en Memoria
            </button>
            <p className="text-xs text-gray-600 mt-1">(Los resultados se mostrarán en la consola)</p>
          </div>

          <div className="mt-4">
            <h4 className="font-medium text-yellow-800">Depuración del Hook:</h4>
            <button
              onClick={() => {
                console.log("Estado del hook useTranslations:", {
                  isLoaded,
                  language,
                  t: typeof t,
                })

                // Probar algunas traducciones con diferentes parámetros
                console.log("Pruebas de traducción con diferentes parámetros:")
                console.log("t('opportunities.table_view'):", t("opportunities.table_view"))
                console.log(
                  "t('opportunities.table_view', 'Valor por defecto'):",
                  t("opportunities.table_view", "Valor por defecto"),
                )
                console.log("t('clave.inexistente'):", t("clave.inexistente"))
                console.log("t('clave.inexistente', 'Valor por defecto'):", t("clave.inexistente", "Valor por defecto"))

                alert("Información de depuración enviada a la consola.")
              }}
              className="px-3 py-1 bg-green-100 hover:bg-green-200 rounded text-sm mt-1"
            >
              Depurar Hook
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
