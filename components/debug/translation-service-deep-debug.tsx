"use client"

import { useState } from "react"
import { TranslationService } from "@/lib/services/translation-service"
import { supabase } from "@/lib/supabase/client"

export function TranslationServiceDeepDebug() {
  const [dbCheck, setDbCheck] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkDatabase = async () => {
    setLoading(true)
    try {
      // Check if translations table exists and has data
      const { data, error, count } = await supabase.from("translations").select("*", { count: "exact" }).limit(5)

      setDbCheck({
        error: error?.message || null,
        count,
        sampleData: data,
        tableExists: !error,
      })
    } catch (err) {
      setDbCheck({
        error: err instanceof Error ? err.message : String(err),
        count: 0,
        sampleData: null,
        tableExists: false,
      })
    }
    setLoading(false)
  }

  const forceReload = async () => {
    setLoading(true)
    try {
      await TranslationService.forceReload()
      alert("Translation service reloaded!")
    } catch (err) {
      alert("Error reloading: " + (err instanceof Error ? err.message : String(err)))
    }
    setLoading(false)
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Translation Service Deep Debug</h2>

      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={checkDatabase}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Check Database
          </button>
          <button
            onClick={forceReload}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
          >
            Force Reload
          </button>
        </div>

        {dbCheck && (
          <div>
            <h3 className="font-semibold">Database Check:</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">{JSON.stringify(dbCheck, null, 2)}</pre>
          </div>
        )}

        <div>
          <h3 className="font-semibold">Current Service State:</h3>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(
              {
                isInitialized: TranslationService.isInitialized,
                availableLanguages: TranslationService.getAvailableLanguages(),
                stats: TranslationService.getInitStats(),
                lastError: TranslationService.getLastError(),
              },
              null,
              2,
            )}
          </pre>
        </div>
      </div>
    </div>
  )
}
