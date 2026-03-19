"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"

export function DebugCustomFieldCreation() {
  const [logs, setLogs] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] ${message}`
    console.log(logMessage)
    setLogs((prev) => [...prev, logMessage])
  }

  const runDiagnostic = async () => {
    setIsRunning(true)
    setLogs([])

    try {
      addLog("🔍 Iniciando test de conexión a base de datos...")


      // 1. Verificar autenticación
      addLog("1️⃣ Verificando autenticación...")
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        addLog(`❌ Error de autenticación: ${authError.message}`)
        return
      }

      if (!user) {
        addLog("❌ Usuario no autenticado")
        return
      }

      addLog(`✅ Usuario autenticado: ${user.email} (ID: ${user.id})`)

      // 2. Verificar que la tabla existe
      addLog("2️⃣ Verificando que la tabla opportunity_tech_fields existe...")
      const { count, error: countError } = await supabase
        .from("opportunity_tech_fields")
        .select("*", { count: "exact", head: true })

      if (countError) {
        addLog(`❌ Error accediendo a la tabla: ${countError.message}`)
        return
      }

      addLog(`✅ Tabla existe, registros actuales: ${count}`)

      // 3. Verificar permisos de SELECT
      addLog("3️⃣ Verificando permisos de SELECT...")
      const { data: selectData, error: selectError } = await supabase
        .from("opportunity_tech_fields")
        .select("id, field_name, display_order")
        .limit(5)

      if (selectError) {
        addLog(`❌ Error en SELECT: ${selectError.message}`)
        return
      }

      addLog(`✅ SELECT funciona, registros obtenidos: ${selectData?.length || 0}`)

      // 4. Verificar tech_companies
      addLog("4️⃣ Verificando tech_companies...")
      const { data: techCompanies, error: techError } = await supabase
        .from("tech_companies")
        .select("id, name")
        .limit(5)

      if (techError) {
        addLog(`❌ Error obteniendo tech_companies: ${techError.message}`)
        return
      }

      if (!techCompanies || techCompanies.length === 0) {
        addLog("❌ No hay tech_companies disponibles")
        return
      }

      addLog(`✅ Tech companies disponibles: ${techCompanies.length}`)
      addLog(`Primera empresa: ${techCompanies[0].name} (${techCompanies[0].id})`)

      // 5. Calcular display_order
      addLog("5️⃣ Calculando display_order...")
      const { data: orderData, error: orderError } = await supabase
        .from("opportunity_tech_fields")
        .select("display_order")
        .eq("tech_company_id", techCompanies[0].id)
        .order("display_order", { ascending: false })
        .limit(1)

      if (orderError) {
        addLog(`❌ Error calculando display_order: ${orderError.message}`)
        return
      }

      const nextDisplayOrder = orderData && orderData.length > 0 ? (orderData[0].display_order || 0) + 10 : 10
      addLog(`✅ Display order calculado: ${nextDisplayOrder}`)

      // 6. Intentar INSERT de prueba
      addLog("6️⃣ Intentando INSERT de prueba...")
      const testData = {
        tech_company_id: techCompanies[0].id,
        field_name: `Test Field ${Date.now()}`,
        field_type: "text",
        is_required: false,
        options: null,
        file_config: null,
        display_order: nextDisplayOrder,
      }

      addLog(`Datos de prueba: ${JSON.stringify(testData, null, 2)}`)

      const { data: insertData, error: insertError } = await supabase
        .from("opportunity_tech_fields")
        .insert([testData])
        .select()
        .single()

      if (insertError) {
        addLog(`❌ Error en INSERT: ${insertError.message}`)
        addLog(`Código: ${insertError.code}`)
        addLog(`Detalles: ${insertError.details}`)
        addLog(`Hint: ${insertError.hint}`)
        return
      }

      addLog(`✅ INSERT exitoso! ID: ${insertData.id}`)

      // 7. Limpiar - eliminar el registro de prueba
      addLog("7️⃣ Limpiando registro de prueba...")
      const { error: deleteError } = await supabase.from("opportunity_tech_fields").delete().eq("id", insertData.id)

      if (deleteError) {
        addLog(`⚠️ Error eliminando registro de prueba: ${deleteError.message}`)
      } else {
        addLog("✅ Registro de prueba eliminado")
      }

      addLog("🎉 ¡Diagnóstico completado exitosamente!")
    } catch (error: any) {
      addLog(`💥 Error inesperado: ${error.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>🔧 Diagnóstico de Creación de Campos Personalizados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runDiagnostic} disabled={isRunning} className="w-full">
          {isRunning ? "Ejecutando diagnóstico..." : "🚀 Ejecutar Diagnóstico Completo"}
        </Button>

        {logs.length > 0 && (
          <div className="bg-black text-green-400 p-4 rounded-md font-mono text-sm max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))}
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p>Este diagnóstico verifica:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>✅ Autenticación del usuario</li>
            <li>✅ Acceso a la tabla opportunity_tech_fields</li>
            <li>✅ Permisos de SELECT</li>
            <li>✅ Disponibilidad de tech_companies</li>
            <li>✅ Cálculo correcto de display_order</li>
            <li>✅ Operación de INSERT completa</li>
            <li>✅ Limpieza de datos de prueba</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
