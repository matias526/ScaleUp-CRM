"use client"

import { useEffect } from "react"
import { TranslationService } from "@/lib/services/translation-service"
import { useTranslations } from "@/hooks/use-translations"

// Traducciones críticas que queremos asegurar
const criticalTranslations = {
  en: {
    "opportunities.table_view": "Table View",
    "opportunities.kanban_view": "Kanban View",
    "opportunities.title": "Opportunities",
    "opportunities.create": "Create Opportunity",
    "sidebar.opportunities": "Opportunities",
    "sidebar.dashboard": "Dashboard",
    "sidebar.partners": "Partners",
    "sidebar.tech_companies": "Tech Companies",
    "sidebar.users": "Users",
    "sidebar.tasks": "Tasks",
    "sidebar.settings": "Settings",
  },
  es: {
    "opportunities.table_view": "Vista de Tabla",
    "opportunities.kanban_view": "Vista Kanban",
    "opportunities.title": "Oportunidades",
    "opportunities.create": "Crear Oportunidad",
    "sidebar.opportunities": "Oportunidades",
    "sidebar.dashboard": "Dashboard",
    "sidebar.partners": "Socios",
    "sidebar.tech_companies": "Empresas Tech",
    "sidebar.users": "Usuarios",
    "sidebar.tasks": "Tareas",
    "sidebar.settings": "Configuración",
  },
  pt: {
    "opportunities.table_view": "Visualização em Tabela",
    "opportunities.kanban_view": "Visualização Kanban",
    "opportunities.title": "Oportunidades",
    "opportunities.create": "Criar Oportunidade",
    "sidebar.opportunities": "Oportunidades",
    "sidebar.dashboard": "Dashboard",
    "sidebar.partners": "Parceiros",
    "sidebar.tech_companies": "Empresas Tech",
    "sidebar.users": "Usuários",
    "sidebar.tasks": "Tarefas",
    "sidebar.settings": "Configurações",
  },
}

export function ForceTranslationReload() {
  const { reloadTranslations, language } = useTranslations()

  useEffect(() => {
    // Función para aplicar las traducciones críticas directamente
    const applyTranslations = () => {
      // Asegurarse de que el objeto translations exista
      if (!TranslationService["translations"]) {
        TranslationService["translations"] = {}
      }

      // Aplicar traducciones críticas para todos los idiomas
      Object.entries(criticalTranslations).forEach(([lang, translations]) => {
        // Asegurarse de que el idioma exista
        if (!TranslationService["translations"][lang]) {
          TranslationService["translations"][lang] = {}
        }

        // Añadir cada traducción
        Object.entries(translations).forEach(([key, value]) => {
          TranslationService["translations"][lang][key] = value
        })
      })

      console.log("Traducciones críticas aplicadas directamente")
    }

    // Aplicar traducciones inmediatamente
    applyTranslations()

    // Recargar traducciones para actualizar el hook
    reloadTranslations().then(() => {
      console.log("Traducciones recargadas")

      // Aplicar de nuevo después de la recarga para asegurarnos
      applyTranslations()
    })

    // Aplicar traducciones cada segundo durante 5 segundos para asegurarnos
    const interval = setInterval(() => {
      applyTranslations()
    }, 1000)

    // Limpiar el intervalo después de 5 segundos
    setTimeout(() => {
      clearInterval(interval)
    }, 5000)

    return () => {
      clearInterval(interval)
    }
  }, [reloadTranslations, language])

  return null
}
