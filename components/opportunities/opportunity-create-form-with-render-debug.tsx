"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { getTechCompanies } from "@/lib/services/tech-company-service"
import { getPartners } from "@/lib/services/partner-service"
import type { Tables } from "@/types/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

const formSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  tech_company_id: z.string().min(1, "La empresa tecnológica es obligatoria"),
  partner_id: z.string().optional().nullable(),
})

type FormValues = z.infer<typeof formSchema>

export function OpportunityCreateFormWithRenderDebug() {
  const router = useRouter()

  // RENDER DEBUG
  const renderCount = useRef(0)
  const [renderLog, setRenderLog] = useState<string[]>([])

  useEffect(() => {
    renderCount.current += 1
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `Render #${renderCount.current} at ${timestamp}`
    console.log(`🔄 ${logEntry}`)
    setRenderLog((prev) => [...prev.slice(-5), logEntry])
  })

  // Estados básicos
  const [techCompanies, setTechCompanies] = useState<Tables<"tech_companies">[]>([])
  const [partners, setPartners] = useState<Tables<"partners">[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      tech_company_id: "",
      partner_id: null,
    },
  })

  // Cargar datos iniciales - SIN DEPENDENCIAS PROBLEMÁTICAS
  useEffect(() => {
    async function loadData() {
      try {
        console.log("🚀 Loading initial data...")
        const [techCompaniesData, partnersData] = await Promise.all([getTechCompanies(), getPartners()])

        setTechCompanies(techCompaniesData)
        setPartners(partnersData)
        console.log("✅ Data loaded successfully")
      } catch (error) {
        console.error("❌ Error loading data:", error)
        setError("Error al cargar los datos")
      }
    }

    loadData()
  }, []) // SIN DEPENDENCIAS

  async function onSubmit(values: FormValues) {
    console.log("📝 Form submitted with values:", values)
    // Aquí iría la lógica de envío
  }

  return (
    <div className="space-y-6">
      {/* RENDER DEBUG INFO */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Render Debug Info</AlertTitle>
        <AlertDescription>
          <div className="mt-2 space-y-1">
            <p>
              <strong>Total Renders:</strong> {renderCount.current}
            </p>
            <p>
              <strong>Recent Renders:</strong>
            </p>
            <div className="text-xs font-mono bg-white p-2 rounded">
              {renderLog.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
            {renderCount.current > 5 && (
              <p className="text-red-600 font-medium">⚠️ TOO MANY RENDERS! This is the problem.</p>
            )}
          </div>
        </AlertDescription>
      </Alert>

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Crear Oportunidad (Debug Version)</CardTitle>
          <CardDescription>Versión simplificada para detectar re-renders</CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Título de la oportunidad" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tech_company_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa Tecnológica</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar empresa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {techCompanies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="partner_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partner</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar partner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {partners.map((partner) => (
                          <SelectItem key={partner.id} value={partner.id}>
                            {partner.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Guardando..." : "Guardar"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard/opportunities")}>
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
