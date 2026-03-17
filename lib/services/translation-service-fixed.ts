import { supabase } from "@/lib/supabase/client"

// Traducciones críticas que siempre deben estar disponibles
const criticalTranslations = {
  en: {
    "opportunities.table_view": "Table View",
    "opportunities.kanban_view": "Kanban View",
    "opportunities.title": "Opportunities",
    "opportunities.create": "Create Opportunity",
  },
  es: {
    "opportunities.table_view": "Vista de Tabla",
    "opportunities.kanban_view": "Vista Kanban",
    "opportunities.title": "Oportunidades",
    "opportunities.create": "Crear Oportunidad",
  },
  pt: {
    "opportunities.table_view": "Visualização em Tabela",
    "opportunities.kanban_view": "Visualização Kanban",
    "opportunities.title": "Oportunidades",
    "opportunities.create": "Criar Oportunidade",
  },
}

export class TranslationService {
  private static translations: Record<string, Record<string, string>> = {}
  private static _isInitialized = false
  private static isInitializing = false
  private static initPromise: Promise<void> | null = null
  private static lastError: Error | null = null
  private static debugMode = false
  private static initAttempts = 0
  private static lastInitTime: Date | null = null
  private static translationCount = 0

  // Método para asegurar que las traducciones críticas estén siempre disponibles
  private static ensureCriticalTranslations() {
    // Asegurarse de que los objetos de idioma existan
    Object.keys(criticalTranslations).forEach((lang) => {
      if (!this.translations[lang]) {
        this.translations[lang] = {}
      }

      // Añadir todas las traducciones críticas para este idioma
      Object.entries(criticalTranslations[lang as keyof typeof criticalTranslations]).forEach(([key, value]) => {
        this.translations[lang][key] = value
      })
    })

    console.log("TranslationService: Traducciones críticas aseguradas")
  }

  static async initialize(): Promise<void> {
    this.initAttempts++
    this.lastInitTime = new Date()

    if (this.debugMode) {
      console.log(
        `TranslationService: Intento de inicialización #${this.initAttempts} a las ${this.lastInitTime.toISOString()}`,
      )
    }

    if (this._isInitialized || this.isInitializing) {
      if (this.debugMode) {
        console.log(
          `TranslationService: Ya ${this._isInitialized ? "inicializado" : "inicializando"}, devolviendo promesa existente`,
        )
      }
      return this.initPromise
    }

    this.isInitializing = true
    this.lastError = null

    this.initPromise = new Promise(async (resolve) => {
      try {
        console.log("TranslationService: Iniciando carga de traducciones...")

        // Verificar que el cliente de Supabase esté disponible
        if (!supabase) {
          throw new Error("Cliente de Supabase no disponible")
        }

        // Intentar una consulta simple para verificar la conexión
        try {
          // Usamos una consulta más simple y con timeout
          const { count, error: pingError } = await supabase
            .from("translations")
            .select("*", { count: "exact", head: true })
            .limit(1)
            .maybeSingle()

          if (pingError) {
            console.error("Error al verificar conexión:", pingError)
            throw new Error(`Error de conexión a Supabase: ${pingError.message}`)
          }
        } catch (pingErr) {
          console.error("TranslationService: Error al verificar conexión a Supabase:", pingErr)
          this.lastError = pingErr instanceof Error ? pingErr : new Error(String(pingErr))
          this.isInitializing = false

          // Asegurar traducciones críticas incluso si hay error de conexión
          this.ensureCriticalTranslations()
          this._isInitialized = true

          resolve()
          return
        }

        // Cargar traducciones con manejo de errores mejorado
        try {
          // Modificación: Asegurarse de cargar TODAS las traducciones sin límites implícitos
          const { data, error, count } = await supabase
            .from("translations")
            .select("key, language, value", { count: "exact" })
            .limit(10000) // Un número grande para asegurarse de obtener todas las traducciones

          if (error) {
            console.error("TranslationService: Error al cargar traducciones:", error)
            this.lastError = new Error(`Error al cargar traducciones: ${error.message}`)

            // Asegurar traducciones críticas incluso si hay error en la consulta
            this.ensureCriticalTranslations()
            this._isInitialized = true

            this.isInitializing = false
            resolve()
            return
          }

          if (!data || data.length === 0) {
            console.warn("TranslationService: No se encontraron traducciones en la base de datos")
            this.lastError = new Error("No se encontraron traducciones en la base de datos")

            // Asegurar traducciones críticas incluso si no hay datos
            this.ensureCriticalTranslations()
            this._isInitialized = true

            this.isInitializing = false
            resolve()
            return
          }

          // Organizar las traducciones por idioma y clave
          this.translations = {}
          data.forEach((item) => {
            if (!this.translations[item.language]) {
              this.translations[item.language] = {}
            }
            this.translations[item.language][item.key] = item.value
          })

          this.translationCount = data.length
          console.log(
            "TranslationService: Traducciones cargadas:",
            Object.keys(this.translations).length,
            "idiomas,",
            this.translationCount,
            "traducciones en total",
          )

          // IMPORTANTE: Asegurar que las traducciones críticas estén siempre disponibles
          this.ensureCriticalTranslations()

          if (this.debugMode) {
            // Mostrar estadísticas detalladas
            Object.keys(this.translations).forEach((lang) => {
              const count = Object.keys(this.translations[lang]).length
              console.log(`TranslationService: Idioma ${lang} - ${count} traducciones`)
            })
          }

          // Verificar que al menos exista el idioma inglés
          if (!this.translations["en"]) {
            console.warn("TranslationService: No se encontraron traducciones para el idioma inglés")
            this.lastError = new Error("No se encontraron traducciones para el idioma inglés")
          }

          // Verificar explícitamente algunas traducciones clave para depuración
          const keysToCheck = [
            "opportunities.table_view",
            "opportunities.kanban_view",
            "opportunities.title",
            "opportunities.create",
          ]

          if (this.debugMode) {
            console.log("TranslationService: Verificando traducciones clave:")
            keysToCheck.forEach((key) => {
              const languages = Object.keys(this.translations)
              languages.forEach((lang) => {
                const value = this.translations[lang][key]
                console.log(`${key} (${lang}): ${value || "NO ENCONTRADA"}`)
              })
            })
          }

          this._isInitialized = true
        } catch (loadError) {
          console.error("TranslationService: Error al cargar traducciones:", loadError)
          this.lastError = loadError instanceof Error ? loadError : new Error(String(loadError))

          // Asegurar traducciones críticas incluso si hay error
          this.ensureCriticalTranslations()
          this._isInitialized = true
        } finally {
          this.isInitializing = false
          resolve()
        }
      } catch (error) {
        console.error("TranslationService: Error inesperado al cargar traducciones:", error)
        this.lastError = error instanceof Error ? error : new Error(String(error))

        // Asegurar traducciones críticas incluso si hay error inesperado
        this.ensureCriticalTranslations()
        this._isInitialized = true

        this.isInitializing = false
        resolve()
      }
    })

    return this.initPromise
  }

  // Getter para isInitialized
  static get isInitialized(): boolean {
    return this._isInitialized
  }

  // Activar/desactivar modo debug
  static setDebugMode(enabled: boolean): void {
    this.debugMode = enabled
    console.log(`TranslationService: Modo debug ${enabled ? "activado" : "desactivado"}`)
  }

  // Método para obtener el último error
  static getLastError(): Error | null {
    return this.lastError
  }

  // Método para obtener estadísticas de inicialización
  static getInitStats(): { attempts: number; lastTime: Date | null; count: number } {
    return {
      attempts: this.initAttempts,
      lastTime: this.lastInitTime,
      count: this.translationCount,
    }
  }

  static getTranslation(key: string, language: string, defaultValue = ""): string {
    // Si no está inicializado, devolver el valor por defecto
    if (!this._isInitialized) {
      if (this.debugMode) {
        console.warn(`TranslationService: No inicializado, usando valor por defecto para: ${key}`)
      }

      // Verificar si es una traducción crítica
      if (
        language in criticalTranslations &&
        key in criticalTranslations[language as keyof typeof criticalTranslations]
      ) {
        return criticalTranslations[language as keyof typeof criticalTranslations][
          key as keyof (typeof criticalTranslations)[keyof typeof criticalTranslations]
        ]
      }

      return defaultValue || key
    }

    // Si el idioma no existe, intentar con inglés o devolver el valor por defecto
    if (!this.translations[language]) {
      if (this.debugMode) {
        console.warn(`TranslationService: Idioma ${language} no disponible para clave ${key}, intentando con inglés`)
      }

      // Verificar si es una traducción crítica
      if (
        language in criticalTranslations &&
        key in criticalTranslations[language as keyof typeof criticalTranslations]
      ) {
        return criticalTranslations[language as keyof typeof criticalTranslations][
          key as keyof (typeof criticalTranslations)[keyof typeof criticalTranslations]
        ]
      }

      return this.translations["en"]?.[key] || defaultValue || key
    }

    // Si la clave no existe en el idioma, intentar con inglés o devolver el valor por defecto
    const translation = this.translations[language][key]
    if (!translation) {
      if (this.debugMode) {
        console.warn(`TranslationService: Clave ${key} no encontrada para idioma ${language}, intentando con inglés`)
      }

      // Verificar si es una traducción crítica
      if (
        language in criticalTranslations &&
        key in criticalTranslations[language as keyof typeof criticalTranslations]
      ) {
        return criticalTranslations[language as keyof typeof criticalTranslations][
          key as keyof (typeof criticalTranslations)[keyof typeof criticalTranslations]
        ]
      }
    }

    return translation || this.translations["en"]?.[key] || defaultValue || key
  }

  static async loadTranslations(): Promise<void> {
    return this.initialize()
  }

  static async forceReload(): Promise<void> {
    console.log("TranslationService: Forzando recarga de traducciones...")
    this._isInitialized = false
    this.translations = {}
    this.lastError = null
    this.translationCount = 0
    return this.initialize()
  }

  static async reloadTranslations(): Promise<void> {
    return this.forceReload()
  }

  static async addTranslation(key: string, language: string, value: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("translations").upsert({ key, language, value })

      if (error) {
        console.error("TranslationService: Error al guardar traducción:", error)
        this.lastError = new Error(`Error al guardar traducción: ${error.message}`)
        return false
      }

      // Actualizar el caché local
      if (!this.translations[language]) {
        this.translations[language] = {}
      }
      this.translations[language][key] = value
      this.translationCount++

      return true
    } catch (error) {
      console.error("TranslationService: Error inesperado al guardar traducción:", error)
      this.lastError = error instanceof Error ? error : new Error(String(error))
      return false
    }
  }

  static getAvailableLanguages(): string[] {
    return Object.keys(this.translations)
  }

  static getAllTranslationsForLanguage(language: string): Record<string, string> {
    return this.translations[language] || {}
  }

  static getAllTranslationKeys(): string[] {
    const keys = new Set<string>()

    Object.values(this.translations).forEach((langTranslations) => {
      Object.keys(langTranslations).forEach((key) => keys.add(key))
    })

    return Array.from(keys)
  }

  static debugTranslations() {
    console.log("TranslationService state:", {
      isInitialized: this._isInitialized,
      isInitializing: this.isInitializing,
      languages: Object.keys(this.translations),
      totalKeys: this.getAllTranslationKeys().length,
      totalTranslations: this.translationCount,
      lastError: this.lastError?.message || null,
      initAttempts: this.initAttempts,
      lastInitTime: this.lastInitTime?.toISOString(),
    })

    // Mostrar las primeras 5 traducciones de cada idioma para depuración
    Object.keys(this.translations).forEach((lang) => {
      const keys = Object.keys(this.translations[lang]).slice(0, 5)
      console.log(
        `Muestra de traducciones para ${lang}:`,
        keys.map((k) => `${k}: ${this.translations[lang][k]}`),
      )
    })
  }

  // Método para verificar si una traducción específica existe
  static hasTranslation(key: string, language: string): boolean {
    // Verificar si es una traducción crítica
    if (
      language in criticalTranslations &&
      key in criticalTranslations[language as keyof typeof criticalTranslations]
    ) {
      return true
    }

    if (!this._isInitialized || !this.translations[language]) {
      return false
    }
    return !!this.translations[language][key]
  }

  // Método para obtener todas las traducciones que coinciden con un patrón
  static getTranslationsByPattern(pattern: string): Record<string, Record<string, string>> {
    const result: Record<string, Record<string, string>> = {}

    Object.keys(this.translations).forEach((lang) => {
      result[lang] = {}
      Object.keys(this.translations[lang]).forEach((key) => {
        if (key.includes(pattern)) {
          result[lang][key] = this.translations[lang][key]
        }
      })
    })

    return result
  }

  // Método para verificar traducciones específicas
  static checkSpecificTranslations(keys: string[]): Record<string, Record<string, boolean>> {
    const result: Record<string, Record<string, boolean>> = {}

    Object.keys(this.translations).forEach((lang) => {
      result[lang] = {}
      keys.forEach((key) => {
        // Verificar si es una traducción crítica
        if (lang in criticalTranslations && key in criticalTranslations[lang as keyof typeof criticalTranslations]) {
          result[lang][key] = true
        } else {
          result[lang][key] = !!this.translations[lang][key]
        }
      })
    })

    return result
  }
}
