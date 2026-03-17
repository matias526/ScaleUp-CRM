"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ImageUpload } from "@/components/ui/image-upload"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { type TechCompany, TechCompanyService } from "@/lib/services/tech-company-service"

interface TechCompanyEditFormProps {
  companyId: string
}

export function TechCompanyEditForm({ companyId }: TechCompanyEditFormProps) {
  const router = useRouter()
  const [company, setCompany] = useState<TechCompany | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Campos del formulario
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [logo, setLogo] = useState<File | string | null>(null)
  const [website, setWebsite] = useState("")
  const [description, setDescription] = useState("")
  const [isActive, setIsActive] = useState(true)

  // Cargar datos de la empresa tecnológica
  useEffect(() => {
    const loadCompany = async () => {
      try {
        setIsLoading(true)
        const data = await TechCompanyService.getTechCompanyById(companyId)
        if (!data) {
          throw new Error("No se pudo cargar la empresa tecnológica")
        }

        setCompany(data)
        // Inicializar campos
        setName(data.name || "")
        setCode(data.code || "")
        setLogo(data.logo_url || null)
        setWebsite(data.website || "")
        setDescription(data.description || "")
        setIsActive(data.is_active)
      } catch (err: any) {
        setError(err.message || "Error al cargar la empresa tecnológica")
      } finally {
        setIsLoading(false)
      }
    }

    loadCompany()
  }, [companyId])

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!company) return

    setIsSaving(true)
    setError(null)

    try {
      const result = await TechCompanyService.updateTechCompany(companyId, {
        name,
        code,
        logo: logo instanceof File ? logo : null,
        website: website || null,
        description: description || null,
        is_active: isActive,
      })

      if (!result) {
        throw new Error("No se pudo actualizar la empresa tecnológica")
      }

      // Redirigir a la lista de empresas tecnológicas
      router.push("/dashboard/tech-companies")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Error al actualizar la empresa tecnológica")
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!company) {
    return (
      <Alert variant="destructive">
        <AlertDescription>No se pudo cargar la empresa tecnológica</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editar Empresa Tecnológica</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Código</Label>
            <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <ImageUpload value={logo} onChange={setLogo} label="Logo" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Sitio Web</Label>
            <Input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://ejemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="isActive" checked={isActive} onCheckedChange={(checked) => setIsActive(checked as boolean)} />
            <Label htmlFor="isActive">Activo</Label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
