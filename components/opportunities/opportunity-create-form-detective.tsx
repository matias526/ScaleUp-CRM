"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RenderCauseDebug } from "@/components/debug/render-cause-debug"

const formSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export function OpportunityCreateFormDetective() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Detectar qué está cambiando
  const [stateChanges, setStateChanges] = useState<string[]>([])
  const prevStateRef = useRef<any>({})

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  })

  // Monitorear cambios de estado
  useEffect(() => {
    const currentState = {
      isLoading,
      formState: form.formState,
      formValues: form.getValues(),
    }

    const changes: string[] = []

    if (prevStateRef.current.isLoading !== isLoading) {
      changes.push(`isLoading: ${prevStateRef.current.isLoading} → ${isLoading}`)
    }

    if (prevStateRef.current.formState !== form.formState) {
      changes.push(`formState changed`)
    }

    if (changes.length > 0) {
      const timestamp = new Date().toLocaleTimeString()
      setStateChanges((prev) => [...prev.slice(-10), `${timestamp}: ${changes.join(", ")}`])
      console.log("🔍 State changes:", changes)
    }

    prevStateRef.current = currentState
  }, [isLoading, form.formState, form])

  async function onSubmit(values: FormValues) {
    setIsLoading(true)
    console.log("📝 Form submitted with values:", values)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    alert("Formulario enviado correctamente!")
  }

  return (
    <div className="space-y-6">
      <RenderCauseDebug />

      {stateChanges.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
          <h3 className="font-bold text-yellow-800">State Changes Log:</h3>
          <div className="text-xs font-mono mt-2 max-h-32 overflow-y-auto">
            {stateChanges.map((change, i) => (
              <div key={i}>{change}</div>
            ))}
          </div>
        </div>
      )}

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Crear Oportunidad (Detective Mode)</CardTitle>
          <CardDescription>Detectando la causa del bucle infinito</CardDescription>
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
