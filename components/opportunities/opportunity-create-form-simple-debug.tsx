"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

const formSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export function OpportunityCreateFormSimpleDebug() {
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

  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  })

  async function onSubmit(values: FormValues) {
    setIsLoading(true)
    console.log("📝 Form submitted with values:", values)

    // Simular envío
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsLoading(false)
    alert("Formulario enviado correctamente!")
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
          <CardTitle>Crear Oportunidad (Simple Debug)</CardTitle>
          <CardDescription>Versión ultra-simplificada para detectar re-renders</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Título
              </label>
              <Input id="title" {...form.register("title")} placeholder="Título de la oportunidad" />
              {form.formState.errors.title && (
                <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Descripción
              </label>
              <Input id="description" {...form.register("description")} placeholder="Descripción opcional" />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/dashboard/opportunities")}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
