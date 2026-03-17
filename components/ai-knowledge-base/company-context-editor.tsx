"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Save, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CompanyContextEditorProps {
  techCompanyId: string
}

export function CompanyContextEditor({ techCompanyId }: CompanyContextEditorProps) {
  const [context, setContext] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadContext()
  }, [techCompanyId])

  async function loadContext() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("tech_companies")
        .select("ai_context")
        .eq("id", techCompanyId)
        .single()

      if (error) throw error
      setContext(data?.ai_context || "")
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo cargar el contexto",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function saveContext() {
    try {
      setSaving(true)
      const { error } = await supabase.from("tech_companies").update({ ai_context: context }).eq("id", techCompanyId)

      if (error) throw error

      toast({
        title: "Guardado",
        description: "El contexto de Mika se actualizó correctamente",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo guardar el contexto",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contexto de Mika</CardTitle>
        <CardDescription>Define cómo Mika debe entender tu empresa, metodología y usuarios</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
          <div className="flex gap-2">
            <Info className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium mb-1">¿Qué incluir en el contexto?</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Descripción de tu empresa y su enfoque</li>
                <li>Metodología de trabajo</li>
                <li>Perfil de usuarios que consultan</li>
                <li>Objetivos típicos de las consultas</li>
                <li>Tono y estilo de comunicación esperado</li>
              </ul>
            </div>
          </div>
        </div>

        <Textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Ejemplo:&#10;&#10;Somos una consultora especializada en...&#10;&#10;Metodología:&#10;- Enfoque práctico&#10;- Acompañamiento continuo&#10;&#10;Usuarios:&#10;- Gerentes de empresas en crecimiento&#10;- Equipos técnicos..."
          className="min-h-[400px] font-mono text-sm"
        />

        <div className="flex justify-end">
          <Button onClick={saveContext} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Contexto
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
